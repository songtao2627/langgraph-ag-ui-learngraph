"""
Tests for the ChatWorkflow implementation.
"""

import pytest
import asyncio
from datetime import datetime

from app.chat.workflow import ChatWorkflow
from app.models.chat import ChatRequest, ChatResponse
from app.models.message import MessageType


class TestChatWorkflow:
    """Test cases for ChatWorkflow class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.workflow = ChatWorkflow()
    
    @pytest.mark.asyncio
    async def test_basic_message_processing(self):
        """Test basic message processing through the workflow."""
        # Create a test request
        request = ChatRequest(
            message="Hello, how are you?",
            conversation_id=None
        )
        
        # Process the message
        response = await self.workflow.process_message(request)
        
        # Verify response structure
        assert isinstance(response, ChatResponse)
        assert response.response is not None
        assert len(response.response) > 0
        assert response.conversation_id is not None
        assert response.conversation_id.startswith("conv_")
        assert isinstance(response.timestamp, datetime)
        assert response.processing_time is not None
        assert response.processing_time >= 0
    
    @pytest.mark.asyncio
    async def test_conversation_continuity(self):
        """Test that conversation context is maintained across messages."""
        # First message
        request1 = ChatRequest(
            message="Hello, my name is Alice",
            conversation_id=None
        )
        response1 = await self.workflow.process_message(request1)
        conversation_id = response1.conversation_id
        
        # Second message in the same conversation
        request2 = ChatRequest(
            message="What did I just tell you?",
            conversation_id=conversation_id
        )
        response2 = await self.workflow.process_message(request2)
        
        # Verify conversation continuity
        assert response2.conversation_id == conversation_id
        assert "message #2" in response2.response  # Should indicate it's the second message
        
        # Check conversation history
        conversation = self.workflow.get_conversation(conversation_id)
        assert conversation is not None
        assert len(conversation.messages) == 4  # 2 user + 2 AI messages
        
        # Verify message types
        user_messages = conversation.get_messages_by_type(MessageType.USER)
        ai_messages = conversation.get_messages_by_type(MessageType.AI)
        assert len(user_messages) == 2
        assert len(ai_messages) == 2
    
    @pytest.mark.asyncio
    async def test_greeting_detection(self):
        """Test that greeting messages are handled specially."""
        request = ChatRequest(
            message="Hi there!",
            conversation_id=None
        )
        
        response = await self.workflow.process_message(request)
        
        # Should contain greeting response
        assert "Hello!" in response.response
    
    @pytest.mark.asyncio
    async def test_empty_message_handling(self):
        """Test handling of empty or whitespace-only messages."""
        request = ChatRequest(
            message="   ",  # Whitespace only
            conversation_id=None
        )
        
        response = await self.workflow.process_message(request)
        
        # Should return error response
        assert "error" in response.response.lower()
    
    def test_conversation_management(self):
        """Test conversation management methods."""
        # Initially no conversations
        assert self.workflow.get_conversation("nonexistent") is None
        
        # Create a conversation through message processing
        asyncio.run(self._create_test_conversation())
        
        # Test conversation retrieval
        conversations = list(self.workflow.conversations.keys())
        assert len(conversations) >= 1
        
        conversation_id = conversations[0]
        conversation = self.workflow.get_conversation(conversation_id)
        assert conversation is not None
        
        # Test history retrieval
        history = self.workflow.get_conversation_history(conversation_id)
        assert len(history) > 0
        
        # Test conversation clearing
        assert self.workflow.clear_conversation(conversation_id) is True
        assert self.workflow.get_conversation(conversation_id) is None
        assert self.workflow.clear_conversation(conversation_id) is False  # Already cleared
    
    async def _create_test_conversation(self):
        """Helper method to create a test conversation."""
        request = ChatRequest(
            message="Test message",
            conversation_id=None
        )
        await self.workflow.process_message(request)
    
    @pytest.mark.asyncio
    async def test_workflow_state_management(self):
        """Test that workflow state is properly managed."""
        request = ChatRequest(
            message="Test state management",
            conversation_id="test_conv_123"
        )
        
        response = await self.workflow.process_message(request)
        
        # Verify state was properly managed
        assert response.conversation_id == "test_conv_123"
        
        # Check that conversation was created with correct ID
        conversation = self.workflow.get_conversation("test_conv_123")
        assert conversation is not None
        assert conversation.id == "test_conv_123"
    
    @pytest.mark.asyncio
    async def test_mock_response_variety(self):
        """Test that mock responses show variety based on input."""
        responses = []
        
        # Generate multiple responses with different inputs
        test_messages = [
            "Short",
            "This is a longer message to test response variety",
            "Another different message",
            "Yet another unique input",
            "Final test message"
        ]
        
        for msg in test_messages:
            request = ChatRequest(message=msg, conversation_id=None)
            response = await self.workflow.process_message(request)
            responses.append(response.response)
        
        # Verify we get different responses (at least some variety)
        unique_responses = set(responses)
        assert len(unique_responses) > 1  # Should have some variety in responses


if __name__ == "__main__":
    pytest.main([__file__])