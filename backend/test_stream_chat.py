#!/usr/bin/env python3
"""
测试流式聊天功能的脚本。
"""

import asyncio
import httpx
import json
from datetime import datetime


async def test_stream_chat():
    """测试流式聊天端点"""
    
    # 测试数据
    test_request = {
        "message": "你好，请介绍一下你自己",
        "conversation_id": None
    }
    
    print(f"[{datetime.now()}] 开始测试流式聊天...")
    print(f"发送消息: {test_request['message']}")
    print("-" * 50)
    
    try:
        async with httpx.AsyncClient() as client:
            # 发送流式请求
            async with client.stream(
                "POST",
                "http://localhost:8000/api/chat/stream",
                json=test_request,
                headers={"Accept": "text/event-stream"}
            ) as response:
                
                if response.status_code != 200:
                    print(f"错误: HTTP {response.status_code}")
                    print(await response.aread())
                    return
                
                print("开始接收流式响应:")
                full_response = ""
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]  # 移除 "data: " 前缀
                        
                        try:
                            chunk_data = json.loads(data_str)
                            chunk_type = chunk_data.get("type")
                            content = chunk_data.get("content", "")
                            conversation_id = chunk_data.get("conversation_id")
                            
                            if chunk_type == "start":
                                print(f"[开始] 会话ID: {conversation_id}")
                                
                            elif chunk_type == "chunk":
                                print(f"[块] {content}", end="", flush=True)
                                full_response += content
                                
                            elif chunk_type == "end":
                                metadata = chunk_data.get("metadata", {})
                                processing_time = metadata.get("processing_time", 0)
                                total_chunks = metadata.get("total_chunks", 0)
                                print(f"\n[结束] 处理时间: {processing_time}s, 总块数: {total_chunks}")
                                
                            elif chunk_type == "error":
                                print(f"\n[错误] {content}")
                                
                        except json.JSONDecodeError as e:
                            print(f"\n[JSON解析错误] {e}: {data_str}")
                
                print(f"\n{'-' * 50}")
                print(f"完整响应: {full_response}")
                
    except Exception as e:
        print(f"测试失败: {str(e)}")


async def test_regular_chat():
    """测试常规聊天端点作为对比"""
    
    test_request = {
        "message": "你好，请介绍一下你自己",
        "conversation_id": None
    }
    
    print(f"\n[{datetime.now()}] 开始测试常规聊天...")
    print(f"发送消息: {test_request['message']}")
    print("-" * 50)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/chat/",
                json=test_request
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"响应: {data['response']}")
                print(f"会话ID: {data['conversation_id']}")
                print(f"处理时间: {data['processing_time']}s")
            else:
                print(f"错误: HTTP {response.status_code}")
                print(response.text)
                
    except Exception as e:
        print(f"测试失败: {str(e)}")


async def main():
    """主函数"""
    print("=" * 60)
    print("流式聊天功能测试")
    print("=" * 60)
    
    # 测试流式聊天
    await test_stream_chat()
    
    # 测试常规聊天作为对比
    await test_regular_chat()
    
    print("\n测试完成!")


if __name__ == "__main__":
    asyncio.run(main())