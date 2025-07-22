"""
Integration test for the complete chat API workflow
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_complete_chat_workflow():
    """测试完整的聊天工作流程"""
    
    # 1. 检查服务健康状态
    health_response = client.get("/api/chat/health")
    assert health_response.status_code == 200
    health_data = health_response.json()
    assert health_data["status"] == "healthy"
    print(f"✓ 服务健康检查通过: {health_data['service']}")
    
    # 2. 发送第一条消息，创建新会话
    conv_id = "integration_test_conv"
    first_message = {
        "message": "Hello, I'm testing the chat API. Please remember my name is Alice.",
        "conversation_id": conv_id
    }
    
    response1 = client.post("/api/chat/", json=first_message)
    assert response1.status_code == 200
    data1 = response1.json()
    assert data1["conversation_id"] == conv_id
    assert len(data1["response"]) > 0
    assert "processing_time" in data1
    print(f"✓ 第一条消息发送成功，响应长度: {len(data1['response'])}")
    
    # 3. 发送第二条消息，测试上下文保持
    second_message = {
        "message": "What is my name?",
        "conversation_id": conv_id
    }
    
    response2 = client.post("/api/chat/", json=second_message)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["conversation_id"] == conv_id
    print(f"✓ 第二条消息发送成功，测试上下文保持")
    
    # 4. 获取会话历史
    history_response = client.get(f"/api/chat/history/{conv_id}")
    assert history_response.status_code == 200
    history_data = history_response.json()
    assert history_data["conversation_id"] == conv_id
    assert history_data["message_count"] >= 4  # 至少2条用户消息 + 2条AI响应
    print(f"✓ 会话历史获取成功，消息数量: {history_data['message_count']}")
    
    # 5. 检查会话列表
    conversations_response = client.get("/api/chat/conversations")
    assert conversations_response.status_code == 200
    conversations_data = conversations_response.json()
    assert conversations_data["total_count"] >= 1
    
    # 查找我们的测试会话
    test_conv_found = False
    for conv in conversations_data["conversations"]:
        if conv["conversation_id"] == conv_id:
            test_conv_found = True
            assert conv["message_count"] >= 4
            break
    
    assert test_conv_found, f"测试会话 {conv_id} 未在会话列表中找到"
    print(f"✓ 会话列表检查通过，总会话数: {conversations_data['total_count']}")
    
    # 6. 测试会话历史限制
    limited_history = client.get(f"/api/chat/history/{conv_id}?limit=2")
    assert limited_history.status_code == 200
    limited_data = limited_history.json()
    assert limited_data["limit"] == 2
    assert len(limited_data["messages"]) <= 2
    print(f"✓ 限制历史记录功能正常，返回消息数: {len(limited_data['messages'])}")
    
    # 7. 清除会话
    clear_response = client.delete(f"/api/chat/history/{conv_id}")
    assert clear_response.status_code == 200
    clear_data = clear_response.json()
    assert clear_data["status"] == "success"
    print(f"✓ 会话清除成功")
    
    # 8. 验证会话已被清除
    cleared_history = client.get(f"/api/chat/history/{conv_id}")
    assert cleared_history.status_code == 200
    cleared_data = cleared_history.json()
    assert cleared_data["message_count"] == 0
    print(f"✓ 会话清除验证通过")
    
    print("\n🎉 完整的聊天API工作流程测试通过！")


def test_error_handling_workflow():
    """测试错误处理工作流程"""
    
    # 1. 测试无效请求
    invalid_requests = [
        {},  # 空请求
        {"message": ""},  # 空消息
        {"message": "x" * 1001},  # 超长消息
        {"conversation_id": "test"}  # 缺少消息
    ]
    
    for i, invalid_request in enumerate(invalid_requests):
        response = client.post("/api/chat/", json=invalid_request)
        assert response.status_code == 422, f"无效请求 {i+1} 应该返回422错误"
    
    print("✓ 无效请求错误处理正常")
    
    # 2. 测试不存在的会话历史
    response = client.get("/api/chat/history/nonexistent_conv")
    assert response.status_code == 200
    data = response.json()
    assert data["message_count"] == 0
    print("✓ 不存在会话的历史查询处理正常")
    
    # 3. 测试无效的历史查询参数
    invalid_limits = [0, 101, -1]
    for limit in invalid_limits:
        response = client.get(f"/api/chat/history/test_conv?limit={limit}")
        assert response.status_code == 400, f"无效limit {limit} 应该返回400错误"
    
    print("✓ 无效参数错误处理正常")
    
    # 4. 测试清除不存在的会话
    response = client.delete("/api/chat/history/nonexistent_conv")
    assert response.status_code == 404
    print("✓ 清除不存在会话的错误处理正常")
    
    print("\n🎉 错误处理工作流程测试通过！")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])