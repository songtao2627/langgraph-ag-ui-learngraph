"""
Comprehensive tests for the chat API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestChatAPI:
    """Test suite for chat API endpoints"""
    
    def test_chat_endpoint_basic_functionality(self):
        """测试基本聊天功能"""
        request_data = {
            "message": "Hello, how are you?",
            "conversation_id": "test_conv_basic"
        }
        
        response = client.post("/api/chat/", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert "conversation_id" in data
        assert "timestamp" in data
        assert "processing_time" in data
        assert data["conversation_id"] == "test_conv_basic"
        assert isinstance(data["response"], str)
        assert len(data["response"]) > 0
        assert isinstance(data["processing_time"], (int, float))
    
    def test_chat_endpoint_auto_conversation_id(self):
        """测试自动生成会话ID"""
        request_data = {
            "message": "Hello without conversation ID"
        }
        
        response = client.post("/api/chat/", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "conversation_id" in data
        assert data["conversation_id"].startswith("conv_")
        assert len(data["conversation_id"]) > 5
    
    def test_chat_endpoint_validation_errors(self):
        """测试各种验证错误"""
        # 空消息
        response = client.post("/api/chat/", json={"message": ""})
        assert response.status_code == 422
        
        # 超长消息
        long_message = "x" * 1001
        response = client.post("/api/chat/", json={"message": long_message})
        assert response.status_code == 422
        
        # 缺少消息字段
        response = client.post("/api/chat/", json={"conversation_id": "test"})
        assert response.status_code == 422
        
        # 空JSON
        response = client.post("/api/chat/", json={})
        assert response.status_code == 422
    
    def test_conversation_history_endpoint(self):
        """测试会话历史获取"""
        # 先发送一些消息创建会话
        conv_id = "test_history_conv"
        messages = ["Hello", "How are you?", "What's the weather?"]
        
        for msg in messages:
            response = client.post("/api/chat/", json={
                "message": msg,
                "conversation_id": conv_id
            })
            assert response.status_code == 200
        
        # 获取会话历史
        response = client.get(f"/api/chat/history/{conv_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "conversation_id" in data
        assert "messages" in data
        assert "message_count" in data
        assert "timestamp" in data
        assert data["conversation_id"] == conv_id
        assert isinstance(data["messages"], list)
        assert data["message_count"] > 0
    
    def test_conversation_history_with_limit(self):
        """测试带限制的会话历史获取"""
        conv_id = "test_limit_conv"
        
        # 发送多条消息
        for i in range(5):
            response = client.post("/api/chat/", json={
                "message": f"Message {i+1}",
                "conversation_id": conv_id
            })
            assert response.status_code == 200
        
        # 获取限制数量的历史
        response = client.get(f"/api/chat/history/{conv_id}?limit=3")
        assert response.status_code == 200
        
        data = response.json()
        assert data["limit"] == 3
        assert len(data["messages"]) <= 3
    
    def test_conversation_history_validation(self):
        """测试会话历史获取的验证"""
        # 空会话ID
        response = client.get("/api/chat/history/")
        assert response.status_code == 404  # FastAPI路由不匹配
        
        # 无效的limit参数
        response = client.get("/api/chat/history/test_conv?limit=0")
        assert response.status_code == 400
        
        response = client.get("/api/chat/history/test_conv?limit=101")
        assert response.status_code == 400
        
        # 不存在的会话ID（应该返回空列表，不是错误）
        response = client.get("/api/chat/history/nonexistent_conv")
        assert response.status_code == 200
        data = response.json()
        assert data["message_count"] == 0
    
    def test_clear_conversation_endpoint(self):
        """测试清除会话功能"""
        # 先创建一个会话
        conv_id = "test_clear_conv"
        response = client.post("/api/chat/", json={
            "message": "Hello for clearing",
            "conversation_id": conv_id
        })
        assert response.status_code == 200
        
        # 确认会话存在
        response = client.get(f"/api/chat/history/{conv_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["message_count"] > 0
        
        # 清除会话
        response = client.delete(f"/api/chat/history/{conv_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert conv_id in data["message"]
    
    def test_clear_nonexistent_conversation(self):
        """测试清除不存在的会话"""
        response = client.delete("/api/chat/history/nonexistent_conv")
        assert response.status_code == 404
    
    def test_list_conversations_endpoint(self):
        """测试获取会话列表"""
        # 创建几个会话
        conv_ids = ["list_test_1", "list_test_2", "list_test_3"]
        
        for conv_id in conv_ids:
            response = client.post("/api/chat/", json={
                "message": f"Hello from {conv_id}",
                "conversation_id": conv_id
            })
            assert response.status_code == 200
        
        # 获取会话列表
        response = client.get("/api/chat/conversations")
        assert response.status_code == 200
        
        data = response.json()
        assert "conversations" in data
        assert "total_count" in data
        assert "timestamp" in data
        assert isinstance(data["conversations"], list)
        assert data["total_count"] >= len(conv_ids)
        
        # 检查会话信息结构
        if data["conversations"]:
            conv = data["conversations"][0]
            assert "conversation_id" in conv
            assert "message_count" in conv
            assert "created_at" in conv
            assert "updated_at" in conv
            assert "last_message_preview" in conv
    
    def test_chat_service_health_endpoint(self):
        """测试聊天服务健康检查"""
        response = client.get("/api/chat/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "chat-service"
        assert "ai_model" in data
        assert "active_conversations" in data
        assert "timestamp" in data
        assert isinstance(data["active_conversations"], int)
    
    def test_conversation_context_persistence(self):
        """测试会话上下文持久性"""
        conv_id = "context_test_conv"
        
        # 第一条消息
        response1 = client.post("/api/chat/", json={
            "message": "My name is Alice",
            "conversation_id": conv_id
        })
        assert response1.status_code == 200
        
        # 第二条消息，测试上下文是否保持
        response2 = client.post("/api/chat/", json={
            "message": "What is my name?",
            "conversation_id": conv_id
        })
        assert response2.status_code == 200
        
        # 检查会话历史
        history_response = client.get(f"/api/chat/history/{conv_id}")
        assert history_response.status_code == 200
        
        history_data = history_response.json()
        assert history_data["message_count"] >= 4  # 2 user + 2 AI messages
    
    def test_multiple_concurrent_conversations(self):
        """测试多个并发会话"""
        conv_ids = ["concurrent_1", "concurrent_2", "concurrent_3"]
        
        # 并发创建多个会话
        for conv_id in conv_ids:
            response = client.post("/api/chat/", json={
                "message": f"Hello from conversation {conv_id}",
                "conversation_id": conv_id
            })
            assert response.status_code == 200
        
        # 验证每个会话都独立存在
        for conv_id in conv_ids:
            response = client.get(f"/api/chat/history/{conv_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["conversation_id"] == conv_id
            assert data["message_count"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])