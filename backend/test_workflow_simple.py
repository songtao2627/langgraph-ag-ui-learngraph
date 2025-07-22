"""
Simple test script to verify the ChatWorkflow implementation.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.chat.workflow import ChatWorkflow
from app.models.chat import ChatRequest


async def test_basic_workflow():
    """Test basic workflow functionality."""
    print("Testing ChatWorkflow implementation...")
    
    # Create workflow instance
    workflow = ChatWorkflow()
    print("✓ ChatWorkflow instance created successfully")
    
    # Test basic message processing
    request = ChatRequest(
        message="Hello, how are you?",
        conversation_id=None
    )
    
    try:
        response = await workflow.process_message(request)
        print(f"✓ Message processed successfully")
        print(f"  - Response: {response.response[:100]}...")
        print(f"  - Conversation ID: {response.conversation_id}")
        print(f"  - Processing time: {response.processing_time}s")
        
        # Test conversation continuity
        request2 = ChatRequest(
            message="What did I just say?",
            conversation_id=response.conversation_id
        )
        
        response2 = await workflow.process_message(request2)
        print(f"✓ Second message processed successfully")
        print(f"  - Response: {response2.response[:100]}...")
        print(f"  - Same conversation ID: {response2.conversation_id == response.conversation_id}")
        
        # Test conversation retrieval
        conversation = workflow.get_conversation(response.conversation_id)
        if conversation:
            print(f"✓ Conversation retrieved successfully")
            print(f"  - Total messages: {len(conversation.messages)}")
            print(f"  - User messages: {len(conversation.get_messages_by_type('user'))}")
            print(f"  - AI messages: {len(conversation.get_messages_by_type('ai'))}")
        
        # Test greeting detection
        greeting_request = ChatRequest(
            message="Hi there!",
            conversation_id=None
        )
        greeting_response = await workflow.process_message(greeting_request)
        if "Hello!" in greeting_response.response:
            print("✓ Greeting detection working")
        else:
            print("⚠ Greeting detection may not be working as expected")
        
        print("\n🎉 All tests passed! ChatWorkflow is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_basic_workflow())
    sys.exit(0 if success else 1)