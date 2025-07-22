"""
Chat-related Pydantic models for request/response handling.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ChatRequest(BaseModel):
    """
    Request model for chat API endpoint.
    
    Attributes:
        message: User's input message (required, 1-1000 characters)
        conversation_id: Optional conversation identifier for context
    """
    message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User's input message"
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Optional conversation ID for maintaining context"
    )
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        """Validate message content."""
        if not v or not v.strip():
            raise ValueError('Message cannot be empty or whitespace only')
        return v.strip()
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Hello, how can you help me?",
                "conversation_id": "conv_123456"
            }
        }
    )


class ChatResponse(BaseModel):
    """
    Response model for chat API endpoint.
    
    Attributes:
        response: AI-generated response message
        conversation_id: Conversation identifier
        timestamp: Response generation timestamp
        processing_time: Time taken to process the request (in seconds)
    """
    response: str = Field(
        ...,
        description="AI-generated response message"
    )
    conversation_id: str = Field(
        ...,
        description="Conversation identifier"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response generation timestamp"
    )
    processing_time: Optional[float] = Field(
        None,
        ge=0,
        description="Processing time in seconds"
    )
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "response": "Hello! I'm here to help you with any questions you have.",
                "conversation_id": "conv_123456",
                "timestamp": "2024-01-01T12:00:00Z",
                "processing_time": 1.23
            }
        }


class StreamChunk(BaseModel):
    """
    流式响应的数据块模型。
    
    Attributes:
        type: 数据块类型 ('start', 'chunk', 'end', 'error')
        content: 数据块内容
        conversation_id: 会话ID
        timestamp: 时间戳
        metadata: 额外的元数据
    """
    type: str = Field(
        ...,
        description="数据块类型: start, chunk, end, error"
    )
    content: str = Field(
        default="",
        description="数据块内容"
    )
    conversation_id: str = Field(
        ...,
        description="会话标识符"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="时间戳"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="额外的元数据"
    )
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "type": "chunk",
                "content": "Hello! I'm here to help",
                "conversation_id": "conv_123456",
                "timestamp": "2024-01-01T12:00:00Z",
                "metadata": {"chunk_index": 1}
            }
        }