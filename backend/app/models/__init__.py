"""
Data models for the AI-UI minimal project.
"""

from .chat import ChatRequest, ChatResponse
from .message import Message, Conversation

__all__ = [
    "ChatRequest",
    "ChatResponse", 
    "Message",
    "Conversation"
]