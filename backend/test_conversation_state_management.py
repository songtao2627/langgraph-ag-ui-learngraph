#!/usr/bin/env python3
"""
测试会话状态管理的线程安全性和一致性。

这个测试验证任务5的实现：
- 确保流式处理完成后会话历史正确更新
- 处理流式处理期间对会话状态的并发访问
- 维护流式和非流式聊天模式之间的一致性
"""

import asyncio
import pytest
import threading
import time
from unittest.mock import AsyncMock, MagicMock
from concurrent.futures import ThreadPoolExecutor

from app.chat.workflow import ChatWorkflow
from app.models.chat import ChatRequest
from app.models.message import MessageType


class MockAIModel:
    """模拟AI模型用于测试"""
    
    def __init__(self, response_delay=0.1, chunk_count=5):
        self.response_delay = response_delay
        self.chunk_count = chunk_count
    
    async def generate_response(self, messages):
        """模拟非流式响应"""
        await asyncio.sleep(self.response_delay)
        return "这是一个完整的AI响应"
    
    async def generate_response_stream(self, messages):
        """模拟流式响应"""
        for i in range(self.chunk_count):
            await asyncio.sleep(self.response_delay / self.chunk_count)
            yield f"块{i+1} "
    
    async def get_model_info(self):
        """模拟获取模型信息"""
        return {"model": "test-model", "version": "1.0"}


@pytest.fixture
def workflow():
    """创建测试用的工作流实例"""
    mock_model = MockAIModel()
    workflow = ChatWorkflow(ai_model=mock_model)
    return workflow


@pytest.mark.asyncio
async def test_conversation_state_consistency_streaming_vs_non_streaming(workflow):
    """测试流式和非流式模式之间的会话状态一致性"""
    await workflow.async_setup()
    
    conversation_id = "test_consistency_conv"
    
    # 1. 发送非流式消息
    non_stream_request = ChatRequest(
        message="这是非流式消息",
        conversation_id=conversation_id
    )
    
    non_stream_response = await workflow.process_message(non_stream_request)
    assert non_stream_response.conversation_id == conversation_id
    
    # 验证会话状态
    conversation = workflow.get_conversation(conversation_id)
    assert conversation is not None
    assert len(conversation.messages) == 2  # 用户消息 + AI响应
    assert conversation.messages[0].type == MessageType.USER
    assert conversation.messages[1].type == MessageType.AI
    
    # 2. 发送流式消息
    stream_request = ChatRequest(
        message="这是流式消息",
        conversation_id=conversation_id
    )
    
    full_response = ""
    chunk_count = 0
    async for chunk in workflow.process_message_stream(stream_request):
        if chunk.type == "chunk":
            full_response += chunk.content
            chunk_count += 1
        elif chunk.type == "end":
            assert chunk.metadata["status"] == "completed"
            assert chunk.metadata["conversation_updated"] is True
    
    # 验证流式处理后的会话状态
    updated_conversation = workflow.get_conversation(conversation_id)
    assert updated_conversation is not None
    assert len(updated_conversation.messages) == 4  # 原有2条 + 新的用户消息 + AI响应
    
    # 验证消息顺序和内容
    messages = updated_conversation.get_recent_messages(limit=4)
    assert messages[0].type == MessageType.AI  # 最新的AI响应
    assert messages[1].type == MessageType.USER  # 流式用户消息
    assert messages[2].type == MessageType.AI  # 非流式AI响应
    assert messages[3].type == MessageType.USER  # 非流式用户消息
    
    # 验证流式响应内容完整性
    assert messages[0].content == full_response.strip()
    assert chunk_count > 0


@pytest.mark.asyncio
async def test_concurrent_streaming_prevention(workflow):
    """测试防止同一会话的并发流式处理"""
    await workflow.async_setup()
    
    conversation_id = "test_concurrent_conv"
    
    # 创建两个并发的流式请求
    request1 = ChatRequest(
        message="第一个流式请求",
        conversation_id=conversation_id
    )
    
    request2 = ChatRequest(
        message="第二个流式请求",
        conversation_id=conversation_id
    )
    
    # 启动第一个流式处理
    stream1_task = asyncio.create_task(
        workflow.process_message_stream(request1).__anext__()
    )
    
    # 等待一小段时间确保第一个流开始
    await asyncio.sleep(0.05)
    
    # 尝试启动第二个流式处理（应该被拒绝）
    error_found = False
    async for chunk in workflow.process_message_stream(request2):
        if chunk.type == "error" and "already being streamed" in chunk.content:
            error_found = True
            assert chunk.metadata["error_category"] == "concurrent_streaming"
            break
    
    assert error_found, "并发流式请求应该被拒绝"
    
    # 清理第一个任务
    stream1_task.cancel()
    try:
        await stream1_task
    except asyncio.CancelledError:
        pass


@pytest.mark.asyncio
async def test_conversation_state_after_streaming_completion(workflow):
    """测试流式处理完成后会话状态的正确更新"""
    await workflow.async_setup()
    
    conversation_id = "test_completion_conv"
    request = ChatRequest(
        message="测试流式完成后的状态",
        conversation_id=conversation_id
    )
    
    # 记录流式处理前的状态
    initial_conversation = workflow.get_conversation(conversation_id)
    assert initial_conversation is None
    
    # 执行流式处理
    chunks_received = []
    full_response = ""
    
    async for chunk in workflow.process_message_stream(request):
        chunks_received.append(chunk)
        if chunk.type == "chunk":
            full_response += chunk.content
        elif chunk.type == "end":
            # 验证结束事件的元数据
            assert "processing_time" in chunk.metadata
            assert "total_chunks" in chunk.metadata
            assert "full_response_length" in chunk.metadata
            assert chunk.metadata["status"] == "completed"
            assert chunk.metadata["conversation_updated"] is True
    
    # 验证流式处理完成后的会话状态
    final_conversation = workflow.get_conversation(conversation_id)
    assert final_conversation is not None
    assert len(final_conversation.messages) == 2  # 用户消息 + AI响应
    
    # 验证消息内容和元数据
    user_message = final_conversation.messages[0]
    ai_message = final_conversation.messages[1]
    
    assert user_message.type == MessageType.USER
    assert user_message.content == request.message
    assert user_message.metadata.get("streaming_session") is True
    
    assert ai_message.type == MessageType.AI
    assert ai_message.content == full_response.strip()
    assert ai_message.metadata.get("streaming_session") is True
    assert "chunk_count" in ai_message.metadata
    assert "processing_time" in ai_message.metadata
    assert "response_length" in ai_message.metadata
    
    # 验证会话不再处于流式状态
    assert not workflow.is_conversation_streaming(conversation_id)


@pytest.mark.asyncio
async def test_thread_safety_with_concurrent_operations(workflow):
    """测试并发操作的线程安全性"""
    await workflow.async_setup()
    
    conversation_id = "test_thread_safety_conv"
    
    # 定义并发操作
    async def add_non_stream_message(msg_num):
        request = ChatRequest(
            message=f"非流式消息 {msg_num}",
            conversation_id=conversation_id
        )
        return await workflow.process_message(request)
    
    def get_conversation_info():
        conv = workflow.get_conversation(conversation_id)
        return len(conv.messages) if conv else 0
    
    def get_history():
        return len(workflow.get_conversation_history(conversation_id, limit=50))
    
    # 并发执行多个操作
    tasks = []
    
    # 添加一些非流式消息
    for i in range(3):
        tasks.append(add_non_stream_message(i))
    
    # 执行并发任务
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 验证所有操作都成功
    for response in responses:
        assert not isinstance(response, Exception)
        assert response.conversation_id == conversation_id
    
    # 验证最终状态的一致性
    final_conversation = workflow.get_conversation(conversation_id)
    assert final_conversation is not None
    assert len(final_conversation.messages) == 6  # 3个用户消息 + 3个AI响应
    
    # 使用线程池测试线程安全的读操作
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for _ in range(10):
            futures.append(executor.submit(get_conversation_info))
            futures.append(executor.submit(get_history))
        
        # 所有读操作应该返回一致的结果
        results = [future.result() for future in futures]
        message_counts = [r for i, r in enumerate(results) if i % 2 == 0]
        history_counts = [r for i, r in enumerate(results) if i % 2 == 1]
        
        # 所有读取应该返回相同的消息数量
        assert all(count == message_counts[0] for count in message_counts)
        assert all(count == history_counts[0] for count in history_counts)


@pytest.mark.asyncio
async def test_conversation_cleanup_during_streaming(workflow):
    """测试流式处理期间的会话清理保护"""
    await workflow.async_setup()
    
    conversation_id = "test_cleanup_protection_conv"
    request = ChatRequest(
        message="测试清理保护",
        conversation_id=conversation_id
    )
    
    # 启动流式处理
    stream_gen = workflow.process_message_stream(request)
    first_chunk = await stream_gen.__anext__()
    assert first_chunk.type == "start"
    
    # 验证会话正在流式处理
    assert workflow.is_conversation_streaming(conversation_id)
    
    # 尝试清理会话（应该被阻止）
    cleanup_result = workflow.clear_conversation(conversation_id)
    assert cleanup_result is False, "流式处理期间不应该允许清理会话"
    
    # 完成流式处理
    async for chunk in stream_gen:
        if chunk.type == "end":
            break
    
    # 现在应该可以清理会话
    assert not workflow.is_conversation_streaming(conversation_id)
    cleanup_result = workflow.clear_conversation(conversation_id)
    assert cleanup_result is True, "流式处理完成后应该允许清理会话"


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])