"""
Simple test script to verify models work correctly.
"""

import sys
sys.path.append('.')

from app.models.chat import ChatRequest, ChatResponse
from app.models.message import Message, Conversation, MessageType
from datetime import datetime

def test_chat_models():
    """Test ChatRequest and ChatResponse models."""
    print("Testing ChatRequest...")
    
    # Test valid request
    request = ChatRequest(message="Hello, world!", conversation_id="conv_123")
    assert request.message == "Hello, world!"
    assert request.conversation_id == "conv_123"
    print("✓ ChatRequest creation successful")
    
    # Test request without conversation_id
    request2 = ChatRequest(message="Hello!")
    assert request2.conversation_id is None
    print("✓ ChatRequest without conversation_id successful")
    
    # Test response
    response = ChatResponse(
        response="Hello there!",
        conversation_id="conv_123",
        processing_time=1.5
    )
    assert response.response == "Hello there!"
    assert response.conversation_id == "conv_123"
    assert response.processing_time == 1.5
    assert isinstance(response.timestamp, datetime)
    print("✓ ChatResponse creation successful")

def test_message_models():
    """Test Message and Conversation models."""
    print("\nTesting Message...")
    
    # Test message creation
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
    print("✓ Message creation successful")
    
    # Test message serialization
    data = message.to_dict()
    assert data["content"] == "Hello, world!"
    assert data["type"] == "user"
    print("✓ Message serialization successful")
    
    # Test message deserialization
    message2 = Message.from_dict(data)
    assert message2.content == message.content
    assert message2.type == message.type
    print("✓ Message deserialization successful")

def test_conversation_models():
    """Test Conversation model."""
    print("\nTesting Conversation...")
    
    # Test conversation creation
    conversation = Conversation()
    assert isinstance(conversation.id, str)
    assert conversation.id.startswith("conv_")
    assert conversation.messages == []
    print("✓ Conversation creation successful")
    
    # Test adding messages
    message1 = conversation.add_message("Hello!", MessageType.USER)
    message2 = conversation.add_message("Hi there!", MessageType.AI)
    
    assert len(conversation.messages) == 2
    assert message1.content == "Hello!"
    assert message1.type == MessageType.USER
    assert message2.content == "Hi there!"
    assert message2.type == MessageType.AI
    print("✓ Adding messages successful")
    
    # Test filtering by type
    user_messages = conversation.get_messages_by_type(MessageType.USER)
    ai_messages = conversation.get_messages_by_type(MessageType.AI)
    
    assert len(user_messages) == 1
    assert len(ai_messages) == 1
    print("✓ Message filtering successful")
    
    # Test serialization
    data = conversation.to_dict()
    assert len(data["messages"]) == 2
    print("✓ Conversation serialization successful")
    
    # Test deserialization
    conversation2 = Conversation.from_dict(data)
    assert len(conversation2.messages) == 2
    assert conversation2.messages[0].content == "Hello!"
    print("✓ Conversation deserialization successful")

if __name__ == "__main__":
    try:
        test_chat_models()
        test_message_models()
        test_conversation_models()
        print("\n🎉 All tests passed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()