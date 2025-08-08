#!/usr/bin/env python3
"""
测试流式聊天错误处理功能。

这个测试文件验证流式聊天系统的错误处理是否按照要求3.1、3.2、3.3正确工作。
"""

import asyncio
import pytest
import logging
from unittest.mock import AsyncMock, MagicMock, patch
from typing import AsyncGenerator

from app.models.chat import ChatRequest, StreamChunk
from app.chat.workflow import ChatWorkflow
from app.chat.ai_models import AIModelInterface

# 配置测试日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MockFailingAIModel(AIModelInterface):
    """模拟失败的AI模型，用于测试错误处理"""
    
    def __init__(self, error_type: str = "general"):
        self.error_type = error_type
    
    async def generate_response(self, messages, **kwargs) -> str:
        raise Exception("Mock AI model error")
    
    async def generate_response_stream(self, messages, **kwargs) -> AsyncGenerator[str, None]:
        """根据错误类型抛出不同的异常"""
        if self.error_type == "timeout":
            raise asyncio.TimeoutError("AI model timeout")
        elif self.error_type == "connection":
            raise ConnectionError("Cannot connect to AI service")
        elif self.error_type == "auth":
            raise ValueError("API key authentication failed")
        elif self.error_type == "rate_limit":
            raise Exception("Rate limit exceeded")
        elif self.error_type == "empty_response":
            # 不产生任何内容，模拟空响应
            return
            yield  # 这行永远不会执行
        else:
            raise Exception("General AI model error")
    
    async def get_model_info(self):
        return {"provider": "Mock", "model_name": "test"}


class MockEmptyAIModel(AIModelInterface):
    """模拟返回空内容的AI模型"""
    
    async def generate_response(self, messages, **kwargs) -> str:
        return ""
    
    async def generate_response_stream(self, messages, **kwargs) -> AsyncGenerator[str, None]:
        # 不产生任何内容
        return
        yield  # 这行永远不会执行
    
    async def get_model_info(self):
        return {"provider": "MockEmpty", "model_name": "empty"}


async def test_input_validation_error():
    """测试输入验证错误处理 (要求3.1)"""
    workflow = ChatWorkflow()
    await workflow.async_setup()
    
    # 测试过长消息
    long_message = "x" * 10001
    request = ChatRequest(message="test", conversation_id="test_conv")
    # 直接修改message属性来测试验证逻辑
    request.message = long_message
    
    chunks = []
    async for chunk in workflow.process_message_stream(request):
        chunks.append(chunk)
    
    # 验证错误处理
    assert len(chunks) == 2  # start + error
    error_chunk = chunks[1]
    assert error_chunk.type == "error"
    assert "过长" in error_chunk.content
    assert error_chunk.metadata["error_category"] == "input_validation"
    
    logger.info("✓ 输入验证错误处理测试通过")


async def test_ai_model_timeout_error():
    """测试AI模型超时错误处理 (要求3.2)"""
    failing_model = MockFailingAIModel(error_type="timeout")
    workflow = ChatWorkflow(ai_model=failing_model)
    await workflow.async_setup()
    
    request = ChatRequest(message="测试消息", conversation_id="test_conv")
    
    chunks = []
    async for chunk in workflow.process_message_stream(request):
        chunks.append(chunk)
    
    # 验证错误处理
    assert len(chunks) == 2  # start + error
    start_chunk = chunks[0]
    error_chunk = chunks[1]
    
    assert start_chunk.type == "start"
    assert error_chunk.type == "error"
    assert "超时" in error_chunk.content
    assert error_chunk.metadata["error_category"] == "ai_model_timeout"
    
    logger.info("✓ AI模型超时错误处理测试通过")


async def test_ai_model_connection_error():
    """测试AI模型连接错误处理 (要求3.2)"""
    failing_model = MockFailingAIModel(error_type="connection")
    workflow = ChatWorkflow(ai_model=failing_model)
    await workflow.async_setup()
    
    request = ChatRequest(message="测试消息", conversation_id="test_conv")
    
    chunks = []
    async for chunk in workflow.process_message_stream(request):
        chunks.append(chunk)
    
    # 验证错误处理
    assert len(chunks) == 2  # start + error
    error_chunk = chunks[1]
    
    assert error_chunk.type == "error"
    assert "连接失败" in error_chunk.content
    assert error_chunk.metadata["error_category"] == "network_error"
    
    logger.info("✓ AI模型连接错误处理测试通过")


async def test_ai_model_auth_error():
    """测试AI模型认证错误处理 (要求3.2)"""
    failing_model = MockFailingAIModel(error_type="auth")
    workflow = ChatWorkflow(ai_model=failing_model)
    await workflow.async_setup()
    
    request = ChatRequest(message="测试消息", conversation_id="test_conv")
    
    chunks = []
    async for chunk in workflow.process_message_stream(request):
        chunks.append(chunk)
    
    # 验证错误处理
    assert len(chunks) == 2  # start + error
    error_chunk = chunks[1]
    assert error_chunk.type == "error"
    assert "认证失败" in error_chunk.content
    assert error_chunk.metadata["error_category"] == "authentication_error"
    
    logger.info("✓ AI模型认证错误处理测试通过")


async def test_ai_model_empty_response():
    """测试AI模型空响应错误处理 (要求3.2)"""
    empty_model = MockEmptyAIModel()
    workflow = ChatWorkflow(ai_model=empty_model)
    await workflow.async_setup()
    
    request = ChatRequest(message="测试消息", conversation_id="test_conv")
    
    chunks = []
    async for chunk in workflow.process_message_stream(request):
        chunks.append(chunk)
    
    # 验证错误处理
    error_chunk = chunks[1]
    assert error_chunk.type == "error"
    assert "未能生成响应" in error_chunk.content
    assert error_chunk.metadata["error_category"] == "ai_model_response"
    
    logger.info("✓ AI模型空响应错误处理测试通过")


async def test_graceful_degradation():
    """测试优雅降级 (要求3.3)"""
    failing_model = MockFailingAIModel(error_type="general")
    workflow = ChatWorkflow(ai_model=failing_model)
    await workflow.async_setup()
    
    request = ChatRequest(message="测试消息", conversation_id="test_conv")
    
    chunks = []
    async for chunk in workflow.process_message_stream(request):
        chunks.append(chunk)
    
    # 验证优雅降级
    assert len(chunks) == 2  # start + error
    start_chunk = chunks[0]
    error_chunk = chunks[1]
    
    # 确保开始事件正常发送
    assert start_chunk.type == "start"
    assert start_chunk.metadata["status"] == "processing"
    
    # 确保错误信息用户友好
    assert error_chunk.type == "error"
    assert "暂时不可用" in error_chunk.content
    assert error_chunk.metadata["error_category"] == "ai_service_error"
    
    # 确保包含处理时间等元数据
    assert "processing_time" in error_chunk.metadata
    assert error_chunk.metadata["processing_time"] > 0
    
    logger.info("✓ 优雅降级测试通过")


async def test_error_chunk_format():
    """测试错误StreamChunk格式符合Pydantic模型 (要求4.2)"""
    failing_model = MockFailingAIModel()
    workflow = ChatWorkflow(ai_model=failing_model)
    await workflow.async_setup()
    
    request = ChatRequest(message="测试消息", conversation_id="test_conv")
    
    chunks = []
    async for chunk in workflow.process_message_stream(request):
        chunks.append(chunk)
    
    error_chunk = chunks[1]
    
    # 验证StreamChunk格式
    assert isinstance(error_chunk, StreamChunk)
    assert error_chunk.type == "error"
    assert isinstance(error_chunk.content, str)
    assert isinstance(error_chunk.conversation_id, str)
    assert error_chunk.timestamp is not None
    assert error_chunk.metadata is not None
    
    # 验证元数据包含必要信息
    assert "error_type" in error_chunk.metadata
    assert "error_category" in error_chunk.metadata
    assert "processing_time" in error_chunk.metadata
    
    logger.info("✓ 错误StreamChunk格式测试通过")


async def test_client_cancellation():
    """测试客户端取消请求的处理"""
    workflow = ChatWorkflow()
    await workflow.async_setup()
    
    request = ChatRequest(message="测试消息", conversation_id="test_conv")
    
    # 模拟客户端取消
    async def cancelled_stream():
        async for chunk in workflow.process_message_stream(request):
            if chunk.type == "start":
                raise asyncio.CancelledError("Client disconnected")
            yield chunk
    
    chunks = []
    try:
        async for chunk in cancelled_stream():
            chunks.append(chunk)
    except asyncio.CancelledError:
        pass
    
    logger.info("✓ 客户端取消处理测试通过")


async def main():
    """运行所有错误处理测试"""
    logger.info("开始流式聊天错误处理测试...")
    
    tests = [
        test_input_validation_error,
        test_ai_model_timeout_error,
        test_ai_model_connection_error,
        test_ai_model_auth_error,
        test_ai_model_empty_response,
        test_graceful_degradation,
        test_error_chunk_format,
        test_client_cancellation,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            await test()
            passed += 1
        except Exception as e:
            logger.error(f"测试失败 {test.__name__}: {e}")
            failed += 1
    
    logger.info(f"测试完成: {passed} 通过, {failed} 失败")
    
    if failed == 0:
        logger.info("🎉 所有错误处理测试通过！")
        return True
    else:
        logger.error("❌ 部分测试失败")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)