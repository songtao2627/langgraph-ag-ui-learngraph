#!/usr/bin/env python3
"""
测试AI模型流式接口实现的脚本。

验证所有AI模型都正确实现了generate_response_stream方法，
并且能够产生非空的内容块。
"""

import asyncio
import sys
import os
from typing import List

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from langchain_core.messages import HumanMessage
from app.chat.ai_providers import MoonshotModel, OpenAIModel, OllamaModel
from app.chat.ai_models import MockAIModel


async def test_model_streaming(model, model_name: str):
    """
    测试单个模型的流式响应功能。
    
    Args:
        model: AI模型实例
        model_name: 模型名称（用于日志）
    """
    print(f"\n=== 测试 {model_name} 流式响应 ===")
    
    # 准备测试消息
    test_messages = [
        HumanMessage(content="你好，请简单介绍一下你自己。")
    ]
    
    try:
        # 检查模型是否有generate_response_stream方法
        if not hasattr(model, 'generate_response_stream'):
            print(f"❌ {model_name}: 缺少 generate_response_stream 方法")
            return False
        
        print(f"✅ {model_name}: 具有 generate_response_stream 方法")
        
        # 测试流式响应
        chunks_received = 0
        total_content = ""
        
        print(f"📡 {model_name}: 开始流式调用...")
        
        async for chunk in model.generate_response_stream(test_messages):
            if chunk:  # 检查chunk不为空
                chunks_received += 1
                total_content += chunk
                print(f"📦 {model_name}: 收到chunk #{chunks_received}: '{chunk[:50]}{'...' if len(chunk) > 50 else ''}'")
            else:
                print(f"⚠️  {model_name}: 收到空chunk")
        
        # 验证结果
        if chunks_received == 0:
            print(f"❌ {model_name}: 没有收到任何chunk")
            return False
        
        if not total_content.strip():
            print(f"❌ {model_name}: 所有chunk的内容都为空")
            return False
        
        print(f"✅ {model_name}: 成功收到 {chunks_received} 个chunk")
        print(f"📝 {model_name}: 总内容长度: {len(total_content)} 字符")
        print(f"📄 {model_name}: 完整内容: {total_content[:100]}{'...' if len(total_content) > 100 else ''}")
        
        return True
        
    except Exception as e:
        print(f"❌ {model_name}: 流式调用失败 - {str(e)}")
        return False


async def main():
    """主测试函数。"""
    print("🚀 开始测试AI模型流式接口实现")
    
    # 要测试的模型列表
    models_to_test = [
        (MockAIModel(), "MockAIModel"),
        (MoonshotModel(), "MoonshotModel"),
        (OpenAIModel(), "OpenAIModel"),
        (OllamaModel(), "OllamaModel"),
    ]
    
    results = []
    
    # 测试每个模型
    for model, model_name in models_to_test:
        try:
            result = await test_model_streaming(model, model_name)
            results.append((model_name, result))
        except Exception as e:
            print(f"❌ {model_name}: 测试过程中发生异常 - {str(e)}")
            results.append((model_name, False))
    
    # 汇总结果
    print("\n" + "="*60)
    print("📊 测试结果汇总")
    print("="*60)
    
    passed = 0
    failed = 0
    
    for model_name, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{model_name:20} : {status}")
        if success:
            passed += 1
        else:
            failed += 1
    
    print(f"\n总计: {passed} 个通过, {failed} 个失败")
    
    if failed == 0:
        print("🎉 所有模型都正确实现了流式接口！")
        return True
    else:
        print("⚠️  部分模型的流式接口实现有问题，需要修复。")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)