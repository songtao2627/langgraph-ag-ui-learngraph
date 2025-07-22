"""
FastAPI应用基础测试
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """测试根路径端点"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "AI-UI Minimal Project Backend"
    assert "version" in data
    assert "status" in data
    assert data["status"] == "running"


def test_health_check():
    """测试健康检查端点"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-ui-backend"


def test_status_endpoint():
    """测试状态端点"""
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ai-ui-backend"
    assert data["status"] == "running"
    assert "python_version" in data
    assert "environment" in data


def test_chat_endpoint_exists():
    """测试聊天端点存在性（不测试功能）"""
    # 只测试端点是否存在，不测试实际功能
    # 发送一个空请求，预期会返回400错误（而不是404）
    response = client.post("/api/chat/", json={})
    assert response.status_code == 422  # Pydantic验证错误