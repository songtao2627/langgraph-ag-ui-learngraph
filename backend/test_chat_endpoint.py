"""
Chat endpoint functionality test
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_chat_endpoint_with_valid_request():
    """测试聊天端点的正常功能"""
    # 发送有效的聊天请求
    request_data = {
        "message": "Hello, how are you?",
        "conversation_id": "test_conv_123"
    }
    
    response = client.post("/api/chat/", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "response" in data
    assert "conversation_id" in data
    assert "timestamp" in data
    assert data["conversation_id"] == "test_conv_123"
    assert isinstance(data["response"], str)
    assert len(data["response"]) > 0


def test_chat_endpoint_without_conversation_id():
    """测试没有会话ID的聊天请求"""
    request_data = {
        "message": "Hello, this is a test message"
    }
    
    response = client.post("/api/chat/", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "response" in data
    assert "conversation_id" in data
    assert "timestamp" in data
    # 应该自动生成会话ID
    assert data["conversation_id"].startswith("conv_")


def test_chat_endpoint_with_empty_message():
    """测试空消息的聊天请求"""
    request_data = {
        "message": "",
        "conversation_id": "test_conv_empty"
    }
    
    response = client.post("/api/chat/", json=request_data)
    assert response.status_code == 422  # Validation error


def test_chat_endpoint_with_long_message():
    """测试超长消息的聊天请求"""
    long_message = "x" * 1001  # 超过1000字符限制
    request_data = {
        "message": long_message,
        "conversation_id": "test_conv_long"
    }
    
    response = client.post("/api/chat/", json=request_data)
    assert response.status_code == 422  # Validation error


def test_chat_endpoint_missing_message():
    """测试缺少消息字段的请求"""
    request_data = {
        "conversation_id": "test_conv_missing"
    }
    
    response = client.post("/api/chat/", json=request_data)
    assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])