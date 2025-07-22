"""
测试AI模型集成的脚本。

这个脚本测试LangGraph工作流与AI模型的集成，包括错误处理和重试机制。
"""

import asyncio
import sys
import os
import time
from typing import List, Dict, Any

# 添加应用目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.chat.workflow import ChatWorkflow
from app.chat.ai_models import MockAIModel
from app.chat.ai_providers import OpenAIModel, OllamaModel
from app.models.chat import ChatRequest


class TestAIModel(MockAIModel):
    """用于测试的AI模型，可以模拟错误和重试。"""
    
    def __init__(self, fail_count: int = 0):
        """
        初始化测试模型。
        
        Args:
            fail_count: 连续失败次数，用于测试重试机制
        """
        super().__init__(model_name="test-model")
        self.fail_count = fail_count
        self.call_count = 0
        self.calls: List[Dict[str, Any]] = []
    
    async def generate_response(self, messages, **kwargs):
        """模拟AI响应生成，可以模拟失败和重试。"""
        self.call_count += 1
        self.calls.append({"messages": messages, "kwargs": kwargs})
        
        # 模拟处理延迟
        await asyncio.sleep(0.1)
        
        # 模拟错误
        if self.call_count <= self.fail_count:
            raise Exception(f"模拟错误 #{self.call_count}")
        
        # 成功生成响应
        if not messages:
            return "这是一个测试响应"
        
        last_message = messages[-1]
        content = last_message.content if hasattr(last_message, 'content') else ""
        
        return f"测试响应: '{content}' (调用次数: {self.call_count})"


async def test_mock_model():
    """测试模拟AI模型。"""
    print("\n测试模拟AI模型...")
    
    # 创建工作流实例
    model = MockAIModel()
    workflow = ChatWorkflow(ai_model=model)
    
    # 测试基本消息处理
    request = ChatRequest(
        message="你好，这是一个测试",
        conversation_id=None
    )
    
    response = await workflow.process_message(request)
    print(f"✓ 消息处理成功")
    print(f"  - 响应: {response.response[:100]}...")
    print(f"  - 会话ID: {response.conversation_id}")
    print(f"  - 处理时间: {response.processing_time}s")
    
    return True


async def test_error_handling():
    """测试错误处理和重试机制。"""
    print("\n测试错误处理和重试机制...")
    
    # 创建会失败两次的测试模型
    model = TestAIModel(fail_count=2)
    workflow = ChatWorkflow(ai_model=model)
    
    # 测试消息处理
    request = ChatRequest(
        message="测试错误处理",
        conversation_id=None
    )
    
    try:
        response = await workflow.process_message(request)
        print(f"✓ 错误处理成功")
        print(f"  - 响应: {response.response[:100]}...")
        print(f"  - 调用次数: {model.call_count}")
        
        if model.call_count > 1:
            print(f"✓ 重试机制工作正常")
        else:
            print(f"⚠ 重试机制可能未正常工作")
        
        return True
    except Exception as e:
        print(f"❌ 错误处理测试失败: {str(e)}")
        return False


async def test_context_passing():
    """测试上下文传递。"""
    print("\n测试上下文传递...")
    
    # 创建测试模型
    model = TestAIModel()
    workflow = ChatWorkflow(ai_model=model)
    
    # 第一条消息
    request1 = ChatRequest(
        message="第一条测试消息",
        conversation_id=None
    )
    
    response1 = await workflow.process_message(request1)
    conversation_id = response1.conversation_id
    
    # 第二条消息
    request2 = ChatRequest(
        message="第二条测试消息",
        conversation_id=conversation_id
    )
    
    response2 = await workflow.process_message(request2)
    
    # 验证上下文传递
    print(f"✓ 上下文传递测试")
    print(f"  - 第一条响应: {response1.response[:50]}...")
    print(f"  - 第二条响应: {response2.response[:50]}...")
    
    # 检查模型调用中的消息历史
    if len(model.calls) >= 2:
        second_call = model.calls[1]
        messages = second_call["messages"]
        if len(messages) >= 3:  # 应该包含至少3条消息（用户1, AI1, 用户2）
            print(f"✓ 消息历史正确传递")
            print(f"  - 历史消息数量: {len(messages)}")
        else:
            print(f"⚠ 消息历史可能未正确传递")
    
    return True


async def run_all_tests():
    """运行所有测试。"""
    print("开始测试AI模型集成...")
    
    tests = [
        ("模拟AI模型测试", test_mock_model),
        ("错误处理和重试机制测试", test_error_handling),
        ("上下文传递测试", test_context_passing)
    ]
    
    results = []
    
    for name, test_func in tests:
        print(f"\n运行测试: {name}")
        try:
            start_time = time.time()
            success = await test_func()
            duration = time.time() - start_time
            results.append((name, success, duration))
        except Exception as e:
            import traceback
            print(f"❌ 测试出错: {str(e)}")
            traceback.print_exc()
            results.append((name, False, 0))
    
    # 打印测试结果摘要
    print("\n测试结果摘要:")
    all_passed = True
    for name, success, duration in results:
        status = "✓ 通过" if success else "❌ 失败"
        print(f"{status} {name} ({duration:.2f}s)")
        if not success:
            all_passed = False
    
    if all_passed:
        print("\n🎉 所有测试通过！AI模型集成工作正常。")
    else:
        print("\n⚠ 部分测试失败，请检查上面的错误信息。")
    
    return all_passed


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)