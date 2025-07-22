"""
Unit tests for Pydantic data models.
"""

import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.chat import ChatRequest, ChatResponse
from app.models.message import Message, Conversation, MessageType


class TestChatRequest:
    """Test cases for ChatRequest model."""
    
    def test_valid_chat_request(self):
        """Test creating a valid chat request."""
        request = ChatRequest(
            message="Hello, world!",
            conversation_id="conv_123"
        )
        assert request.message == "Hello, world!"
        assert request.conversation_id == "conv_123"
    
    def test_chat_request_without_conversation_id(self):
        """Test chat request without conversation ID."""
        request = ChatRequest(message="Hello!")
        assert request.message == "Hello!"
        assert request.conversation_id is None
    
    def test_empty_message_validation(self):
        """Test validation of empty message."""
        with pytest.raises(ValidationError):
            ChatRequest(message="")
    
    def test_whitespace_only_message_validation(self):
        """Test validation of whitespace-only message."""
        with pytest.raises(ValidationError):
            ChatRequest(message="   ")
    
    def test_message_too_long_validation(self):
        """Test validation of message that's too long."""
        long_message = "x" * 1001
        with pytest.raises(ValidationError):
            ChatRequest(message=long_message)
    
    def test_message_trimming(self):
        """Test that message content is trimmed."""
        request = ChatRequest(message="  Hello, world!  ")
        assert request.message == "Hello, world!"


class TestChatResponse:
    """Test cases for ChatResponse model."""
    
    def test_valid_chat_response(self):
        """Test creating a valid chat response."""
        response = ChatResponse(
            response="Hello there!",
            conversation_id="conv_123",
            processing_time=1.5
        )
        assert response.response == "Hello there!"
        assert response.conversation_id == "conv_123"
        assert response.processing_time == 1.5
        assert isinstance(response.timestamp, datetime)
    
    def test_chat_response_without_processing_time(self):
        """Test chat response without processing time."""
        response = ChatResponse(
            response="Hello!",
            conversation_id="conv_123"
        )
        assert response.processing_time is None
    
    def test_negative_processing_time_validation(self):
        """Test validation of negative processing time."""
        with pytest.raises(ValidationError):
            ChatResponse(
                response="Hello!",
                conversation_id="conv_123",
                processing_time=-1.0
            )


class TestMessage:
    """Test cases for Message model."""
    
    def test_valid_message(self):
        """Test creating a valid message."""
        message = Message(
            content="Hello, world!",
            type=MessageType.USER,
            conversation_id="conv_123"
        )
        assert message.content == "Hello, world!"
        assert message.type == MessageType.USER
        assert message.conversation_id == "conv_123"
        assert isinstance(message.id, str)
        assert isinstance(message.timestamp, datetime)
        assert message.metadata == {}
    
    def test_message_with_metadata(self):
        """Test message with metadata."""
        metadata = {"source": "web", "user_id": "user_123"}
        message = Message(
            content="Hello!",
            type=MessageType.AI,
            conversation_id="conv_123",
            metadata=metadata
        )
        assert message.metadata == metadata
    
    def test_empty_content_validation(self):
        """Test validation of empty content."""
        with pytest.raises(ValidationError):
            Message(
                content="",
                type=MessageType.USER,
                conversation_id="conv_123"
            )
    
    def test_content_too_long_validation(self):
        """Test validation of content that's too long."""
        long_content = "x" * 10001
        with pytest.raises(ValidationError):
            Message(
                content=long_content,
                type=MessageType.USER,
                conversation_id="conv_123"
            )
    
    def test_content_trimming(self):
        """Test that content is trimmed."""
        message = Message(
            content="  Hello, world!  ",
            type=MessageType.USER,
            conversation_id="conv_123"
        )
        assert message.content == "Hello, world!"
    
    def test_message_to_dict(self):
        """Test message serialization to dictionary."""
        message = Message(
            content="Hello!",
            type=MessageType.USER,
            conversation_id="conv_123"
        )
        data = message.to_dict()
        
        assert data["content"] == "Hello!"
        assert data["type"] == "user"
        assert data["conversation_id"] == "conv_123"
        assert "id" in data
        assert "timestamp" in data
        assert "metadata" in data
    
    def test_message_from_dict(self):
        """Test message deserialization from dictionary."""
        data = {
            "id": "msg_123",
            "content": "Hello!",
            "type": "user",
            "timestamp": "2024-01-01T12:00:00Z",
            "conversation_id": "conv_123",
            "metadata": {"test": "value"}
        }
        message = Message.from_dict(data)
        
        assert message.id == "msg_123"
        assert message.content == "Hello!"
        assert message.type == MessageType.USER
        assert message.conversation_id == "conv_123"
        assert message.metadata == {"test": "value"}


class TestConversation:
    """Test cases for Conversation model."""
    
    def test_valid_conversation(self):
        """Test creating a valid conversation."""
        conversation = Conversation()
        assert isinstance(conversation.id, str)
        assert conversation.id.startswith("conv_")
        assert conversation.messages == []
        assert isinstance(conversation.created_at, datetime)
        assert isinstance(conversation.updated_at, datetime)
        assert conversation.metadata == {}
    
    def test_add_message(self):
        """Test adding a message to conversation."""
        conversation = Conversation()
        original_updated_at = conversation.updated_at
        
        message = conversation.add_message(
            content="Hello!",
            message_type=MessageType.USER
        )
        
        assert len(conversation.messages) == 1
        assert conversation.messages[0] == message
        assert message.content == "Hello!"
        assert message.type == MessageType.USER
        assert message.conversation_id == conversation.id
        assert conversation.updated_at > original_updated_at
    
    def test_add_message_with_metadata(self):
        """Test adding a message with metadata."""
        conversation = Conversation()
        metadata = {"source": "test"}
        
        message = conversation.add_message(
            content="Hello!",
            message_type=MessageType.AI,
            metadata=metadata
        )
        
        assert message.metadata == metadata
    
    def test_get_messages_by_type(self):
        """Test filtering messages by type."""
        conversation = Conversation()
        
        conversation.add_message("User message 1", MessageType.USER)
        conversation.add_message("AI response 1", MessageType.AI)
        conversation.add_message("User message 2", MessageType.USER)
        
        user_messages = conversation.get_messages_by_type(MessageType.USER)
        ai_messages = conversation.get_messages_by_type(MessageType.AI)
        
        assert len(user_messages) == 2
        assert len(ai_messages) == 1
        assert all(msg.type == MessageType.USER for msg in user_messages)
        assert all(msg.type == MessageType.AI for msg in ai_messages)
    
    def test_get_recent_messages(self):
        """Test getting recent messages."""
        conversation = Conversation()
        
        # Add multiple messages
        for i in range(15):
            conversation.add_message(f"Message {i}", MessageType.USER)
        
        recent_messages = conversation.get_recent_messages(limit=5)
        assert len(recent_messages) == 5
        
        # Should be in reverse chronological order (most recent first)
        assert recent_messages[0].content == "Message 14"
        assert recent_messages[4].content == "Message 10"
    
    def test_conversation_to_dict(self):
        """Test conversation serialization to dictionary."""
        conversation = Conversation()
        conversation.add_message("Hello!", MessageType.USER)
        
        data = conversation.to_dict()
        
        assert "id" in data
        assert "messages" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert "metadata" in data
        assert len(data["messages"]) == 1
        assert data["messages"][0]["content"] == "Hello!"
    
    def test_conversation_from_dict(self):
        """Test conversation deserialization from dictionary."""
        data = {
            "id": "conv_test123",
            "messages": [
                {
                    "id": "msg_1",
                    "content": "Hello!",
                    "type": "user",
                    "timestamp": "2024-01-01T12:00:00Z",
                    "conversation_id": "conv_test123",
                    "metadata": {}
                }
            ],
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z",
            "metadata": {"test": "value"}
        }
        
        conversation = Conversation.from_dict(data)
        
        assert conversation.id == "conv_test123"
        assert len(conversation.messages) == 1
        assert conversation.messages[0].content == "Hello!"
        assert conversation.metadata == {"test": "value"}