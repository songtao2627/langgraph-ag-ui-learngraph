"""
Message and conversation-related Pydantic models.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class MessageType(str, Enum):
    """Enumeration for message types."""
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class Message(BaseModel):
    """
    Individual message model.
    
    Attributes:
        id: Unique message identifier
        content: Message content
        type: Message type (user, ai, system)
        timestamp: Message creation timestamp
        conversation_id: Associated conversation ID
        metadata: Optional metadata for the message
    """
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique message identifier"
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Message content"
    )
    type: MessageType = Field(
        ...,
        description="Message type (user, ai, system)"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Message creation timestamp"
    )
    conversation_id: str = Field(
        ...,
        description="Associated conversation ID"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional metadata for the message"
    )
    
    @validator('content')
    def validate_content(cls, v):
        """Validate message content."""
        if not v or not v.strip():
            raise ValueError('Message content cannot be empty or whitespace only')
        return v.strip()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary for serialization."""
        return {
            "id": self.id,
            "content": self.content,
            "type": self.type.value,
            "timestamp": self.timestamp.isoformat(),
            "conversation_id": self.conversation_id,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Message":
        """Create message from dictionary."""
        if isinstance(data.get("timestamp"), str):
            data["timestamp"] = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
        return cls(**data)
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "msg_123456",
                "content": "Hello, how are you?",
                "type": "user",
                "timestamp": "2024-01-01T12:00:00Z",
                "conversation_id": "conv_123456",
                "metadata": {}
            }
        }


class Conversation(BaseModel):
    """
    Conversation model containing multiple messages.
    
    Attributes:
        id: Unique conversation identifier
        messages: List of messages in the conversation
        created_at: Conversation creation timestamp
        updated_at: Last update timestamp
        metadata: Optional conversation metadata
    """
    id: str = Field(
        default_factory=lambda: f"conv_{uuid.uuid4().hex[:12]}",
        description="Unique conversation identifier"
    )
    messages: List[Message] = Field(
        default_factory=list,
        description="List of messages in the conversation"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Conversation creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last update timestamp"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional conversation metadata"
    )
    
    def add_message(self, content: str, message_type: MessageType, metadata: Optional[Dict[str, Any]] = None) -> Message:
        """
        Add a new message to the conversation.
        
        Args:
            content: Message content
            message_type: Type of message (user, ai, system)
            metadata: Optional message metadata
            
        Returns:
            The created message
        """
        message = Message(
            content=content,
            type=message_type,
            conversation_id=self.id,
            metadata=metadata or {}
        )
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        return message
    
    def get_messages_by_type(self, message_type: MessageType) -> List[Message]:
        """Get all messages of a specific type."""
        return [msg for msg in self.messages if msg.type == message_type]
    
    def get_recent_messages(self, limit: int = 10) -> List[Message]:
        """Get the most recent messages."""
        return sorted(self.messages, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert conversation to dictionary for serialization."""
        return {
            "id": self.id,
            "messages": [msg.to_dict() for msg in self.messages],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Conversation":
        """Create conversation from dictionary."""
        # Convert timestamp strings back to datetime objects
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
        if isinstance(data.get("updated_at"), str):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
        
        # Convert message dictionaries back to Message objects
        if "messages" in data:
            data["messages"] = [Message.from_dict(msg) for msg in data["messages"]]
        
        return cls(**data)
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "conv_123456789abc",
                "messages": [],
                "created_at": "2024-01-01T12:00:00Z",
                "updated_at": "2024-01-01T12:00:00Z",
                "metadata": {}
            }
        }