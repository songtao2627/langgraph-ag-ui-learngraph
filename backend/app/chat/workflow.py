"""
LangGraph-based chat workflow implementation.

This module implements the core AI conversation workflow using LangGraph,
providing message processing, context management, and AI response generation.
"""

import time
import uuid
import logging
import asyncio
import threading
from typing import Dict, List, Optional, Any, TypedDict, AsyncGenerator
from datetime import datetime
from contextlib import asynccontextmanager

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from ..models.message import Message, MessageType, Conversation
from ..models.chat import ChatRequest, ChatResponse, StreamChunk
from .ai_providers import create_default_model
from .ai_models import AIModelInterface

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatState(TypedDict):
    """
    State structure for the chat workflow.
    
    This defines the state that flows through the LangGraph workflow nodes.
    Note: Streaming-related fields have been removed as we now use Direct Streaming approach.
    """
    messages: List[Dict[str, Any]]  # List of message dictionaries
    conversation_id: str
    user_input: str
    ai_response: str
    context: Dict[str, Any]
    processing_start_time: float
    final_response: Optional[Any]  # Add final_response to the state definition


class ChatWorkflow:
    """
    LangGraph-based chat workflow for processing AI conversations.
    
    This class implements a basic conversation workflow with the following nodes:
    1. Input processing - validates and processes user input
    2. Context management - manages conversation history and context
    3. AI response generation - generates AI responses using configured AI model
    4. Output formatting - formats the final response
    
    Thread-safe conversation state management is implemented to handle concurrent
    access during streaming and non-streaming operations.
    """
    
    def __init__(self, ai_model: Optional[AIModelInterface] = None):
        """
        Initialize the chat workflow.
        
        Args:
            ai_model: AI模型接口实现，如果为None则使用默认模型
        """
        self.ai_model = ai_model or create_default_model()
        self.workflow: Optional[StateGraph] = None
        self.conversations: Dict[str, Conversation] = {}
        # Thread lock for conversation state management
        self._conversation_lock = threading.RLock()
        # Track active streaming sessions to prevent concurrent modifications
        self._active_streams: Dict[str, bool] = {}
    
    @asynccontextmanager
    async def _conversation_context(self, conversation_id: str, is_streaming: bool = False):
        """
        Context manager for thread-safe conversation access.
        
        Args:
            conversation_id: The conversation identifier
            is_streaming: Whether this is a streaming operation
            
        Yields:
            The conversation object
            
        Raises:
            ValueError: If conversation is already being streamed and this is another stream request
        """
        with self._conversation_lock:
            # Check for concurrent streaming operations
            if is_streaming and conversation_id in self._active_streams:
                raise ValueError(f"Conversation {conversation_id} is already being streamed")
            
            # Create conversation if it doesn't exist
            if conversation_id not in self.conversations:
                self.conversations[conversation_id] = Conversation(id=conversation_id)
                logger.info(f"Created new conversation: {conversation_id}")
            
            # Mark as active stream if streaming
            if is_streaming:
                self._active_streams[conversation_id] = True
                logger.debug(f"Marked conversation {conversation_id} as active stream")
        
        try:
            yield self.conversations[conversation_id]
        finally:
            # Clean up streaming flag
            if is_streaming:
                with self._conversation_lock:
                    self._active_streams.pop(conversation_id, None)
                    logger.debug(f"Removed active stream flag for conversation {conversation_id}")
    
    def _safe_add_message(self, conversation_id: str, content: str, message_type: MessageType, 
                         metadata: Optional[Dict[str, Any]] = None) -> Message:
        """
        Thread-safe method to add a message to a conversation.
        
        Args:
            conversation_id: The conversation identifier
            content: Message content
            message_type: Type of message
            metadata: Optional message metadata
            
        Returns:
            The created message
        """
        with self._conversation_lock:
            if conversation_id not in self.conversations:
                self.conversations[conversation_id] = Conversation(id=conversation_id)
            
            message = self.conversations[conversation_id].add_message(
                content=content, 
                message_type=message_type, 
                metadata=metadata
            )
            logger.debug(f"Added {message_type.value} message to conversation {conversation_id}")
            return message
    
    def _safe_get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """
        Thread-safe method to get a conversation.
        
        Args:
            conversation_id: The conversation identifier
            
        Returns:
            The conversation or None if not found
        """
        with self._conversation_lock:
            return self.conversations.get(conversation_id)
    
    def _safe_get_recent_messages(self, conversation_id: str, limit: int = 10) -> List[Message]:
        """
        Thread-safe method to get recent messages from a conversation.
        
        Args:
            conversation_id: The conversation identifier
            limit: Maximum number of messages to return
            
        Returns:
            List of recent messages
        """
        with self._conversation_lock:
            conversation = self.conversations.get(conversation_id)
            if not conversation:
                return []
            return conversation.get_recent_messages(limit)

    def _build_workflow(self) -> StateGraph:
        """
        Build the LangGraph workflow.
        
        Returns:
            Configured StateGraph workflow
        """
        workflow = StateGraph(ChatState)
        workflow.add_node("process_input", self._process_input_node)
        workflow.add_node("manage_context", self._manage_context_node)
        workflow.add_node("generate_response", self._generate_response_node)
        workflow.add_node("format_output", self._format_output_node)
        workflow.set_entry_point("process_input")
        workflow.add_edge("process_input", "manage_context")
        workflow.add_edge("manage_context", "generate_response")
        workflow.add_edge("generate_response", "format_output")
        workflow.add_edge("format_output", END)
        return workflow
    


    def _process_input_node(self, state: ChatState) -> ChatState:
        """
        Process and validate user input.
        """
        user_input = state["user_input"]
        conversation_id = state["conversation_id"]
        if not user_input or not user_input.strip():
            raise ValueError("User input cannot be empty.")
        state["processing_start_time"] = time.time()
        
        # Use thread-safe message addition
        self._safe_add_message(conversation_id, user_input, MessageType.USER)
        return state

    def _manage_context_node(self, state: ChatState) -> ChatState:
        """
        Manage conversation context and history.
        """
        conversation_id = state["conversation_id"]
        recent_messages = self._safe_get_recent_messages(conversation_id, limit=10)
        langchain_messages = []
        for msg in recent_messages:
            if msg.type == MessageType.USER:
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.type == MessageType.AI:
                langchain_messages.append(AIMessage(content=msg.content))
        state["context"] = {
            "langchain_messages": langchain_messages,
            "conversation_history_length": len(recent_messages)
        }
        return state

    async def _generate_response_node(self, state: ChatState) -> ChatState:
        """
        Generate AI response using the configured AI model.
        """
        context = state["context"]
        langchain_messages = context.get("langchain_messages", [])
        try:
            start_time = time.time()
            ai_response = await self.ai_model.generate_response(langchain_messages)
            response_time = time.time() - start_time
            logger.info(f"AI响应生成完成，耗时: {response_time:.2f}秒")
            state["ai_response"] = ai_response
            state["model_info"] = await self.ai_model.get_model_info()
            state["response_time"] = response_time
        except Exception as e:
            logger.error(f"AI响应生成失败: {str(e)}")
            state["ai_response"] = f"抱歉，我在处理您的请求时遇到了问题。错误信息: {str(e)}"
            state["error"] = str(e)
        return state
    

    
    def _format_output_node(self, state: ChatState) -> ChatState:
        """
        Format the final output response.
        """
        conversation_id = state["conversation_id"]
        ai_response = state["ai_response"]
        
        # Use thread-safe message addition
        self._safe_add_message(conversation_id, ai_response, MessageType.AI)
        
        state["final_response"] = ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            timestamp=datetime.utcnow(),
            model_info=state.get("model_info"),
            processing_time=time.time() - state["processing_start_time"]
        )
        return state

    async def async_setup(self):
        """异步设置和编译工作流"""
        logger.info("开始异步设置聊天工作流...")
        self.workflow = self._build_workflow().compile()
        # Note: stream_workflow is no longer needed as we use Direct Streaming approach
        logger.info("聊天工作流已成功编译和设置")

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """
        Process a chat message through the LangGraph workflow.
        """
        initial_state: ChatState = {
            "messages": [],
            "conversation_id": request.conversation_id or f"conv_{uuid.uuid4().hex[:12]}",
            "user_input": request.message,
            "ai_response": "",
            "context": {},
            "processing_start_time": 0.0,
            "final_response": None
        }
        try:
            if not self.workflow:
                raise RuntimeError("工作流未初始化。请先调用 async_setup()。")
            final_state = await self.workflow.ainvoke(initial_state)
            return final_state["final_response"]
        except Exception as e:
            import traceback
            logger.error(f"工作流错误: {str(e)}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            return ChatResponse(
                response=f"抱歉，我在处理您的消息时遇到了问题: {str(e)}",
                conversation_id=initial_state["conversation_id"],
                timestamp=datetime.utcnow(),
                processing_time=0.0
            )

    async def process_message_stream(self, request: ChatRequest) -> AsyncGenerator[StreamChunk, None]:
        """
        Process a chat message and return streaming response using Direct Streaming approach.
        
        This method bypasses LangGraph's complex state management and directly handles
        streaming by calling the AI model's streaming interface and managing conversation
        state in a thread-safe manner.
        
        Implements comprehensive error handling according to requirements 3.1, 3.2, 3.3.
        Ensures proper conversation state management for streaming according to requirements 1.3, 4.1.
        """
        conversation_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:12]}"
        start_time = time.time()
        full_response = ""
        chunk_index = 0
        error_occurred = False
        user_message_added = False

        try:
            # Send start event
            yield StreamChunk(
                type="start",
                content="",
                conversation_id=conversation_id,
                metadata={"status": "processing", "timestamp": start_time}
            )
            
            # 1. Process input and validate
            try:
                user_input = request.message
                if not user_input or not user_input.strip():
                    raise ValueError("用户输入不能为空")
                
                # Validate input length
                if len(user_input) > 10000:  # Reasonable limit
                    raise ValueError("用户输入过长，请缩短您的消息")
                    
                logger.info(f"开始处理流式请求 - 会话ID: {conversation_id}, 输入长度: {len(user_input)}")
                
            except ValueError as e:
                logger.warning(f"输入验证失败 - 会话ID: {conversation_id}: {str(e)}")
                error_occurred = True
                yield StreamChunk(
                    type="error",
                    content=f"输入验证错误: {str(e)}",
                    conversation_id=conversation_id,
                    metadata={
                        "error_type": "ValidationError",
                        "error_category": "input_validation",
                        "processing_time": round(time.time() - start_time, 3)
                    }
                )
                return
            
            # 2. Use thread-safe conversation context manager for streaming
            async with self._conversation_context(conversation_id, is_streaming=True) as conversation:
                try:
                    # Add user message to conversation
                    user_message = conversation.add_message(
                        content=user_input, 
                        message_type=MessageType.USER,
                        metadata={"streaming_session": True, "start_time": start_time}
                    )
                    user_message_added = True
                    logger.debug(f"Added user message to conversation {conversation_id} for streaming")
                    
                    # Check conversation limits
                    if len(conversation.messages) > 1000:  # Prevent memory issues
                        logger.warning(f"会话消息过多 - 会话ID: {conversation_id}, 消息数: {len(conversation.messages)}")
                        # Keep only recent messages
                        conversation.messages = conversation.messages[-500:]
                    
                    # 3. Prepare context for AI model
                    recent_messages = conversation.get_recent_messages(limit=10)
                    langchain_messages = []
                    for msg in recent_messages:
                        if msg.type == MessageType.USER:
                            langchain_messages.append(HumanMessage(content=msg.content))
                        elif msg.type == MessageType.AI:
                            langchain_messages.append(AIMessage(content=msg.content))
                    
                    if not langchain_messages:
                        raise ValueError("无法准备对话上下文")
                        
                except ValueError as e:
                    logger.error(f"会话状态管理错误 - 会话ID: {conversation_id}: {str(e)}", exc_info=True)
                    error_occurred = True
                    yield StreamChunk(
                        type="error",
                        content="会话状态管理出现问题，请重新开始对话",
                        conversation_id=conversation_id,
                        metadata={
                            "error_type": type(e).__name__,
                            "error_category": "conversation_management",
                            "processing_time": round(time.time() - start_time, 3)
                        }
                    )
                    return
                        
                except Exception as e:
                    logger.error(f"会话上下文准备错误 - 会话ID: {conversation_id}: {str(e)}", exc_info=True)
                    error_occurred = True
                    yield StreamChunk(
                        type="error",
                        content="对话上下文准备失败，请重试",
                        conversation_id=conversation_id,
                        metadata={
                            "error_type": type(e).__name__,
                            "error_category": "context_preparation",
                            "processing_time": round(time.time() - start_time, 3)
                        }
                    )
                    return
            
            # 4. Direct AI model streaming call with comprehensive error handling
            try:
                logger.info(f"开始直接流式AI调用，会话ID: {conversation_id}")
                ai_stream_started = False
                
                async for chunk_content in self.ai_model.generate_response_stream(langchain_messages):
                    if not ai_stream_started:
                        ai_stream_started = True
                        logger.info(f"AI流式响应已开始 - 会话ID: {conversation_id}")
                    
                    if chunk_content:
                        full_response += chunk_content
                        chunk_index += 1
                        yield StreamChunk(
                            type="chunk",
                            content=chunk_content,
                            conversation_id=conversation_id,
                            metadata={
                                "chunk_index": chunk_index,
                                "response_length": len(full_response)
                            }
                        )
                
                # Check if we received any content
                if not ai_stream_started or not full_response:
                    logger.warning(f"AI模型未返回任何内容 - 会话ID: {conversation_id}")
                    error_occurred = True
                    yield StreamChunk(
                        type="error",
                        content="AI模型未能生成响应，请重试",
                        conversation_id=conversation_id,
                        metadata={
                            "error_type": "EmptyResponseError",
                            "error_category": "ai_model_response",
                            "processing_time": round(time.time() - start_time, 3)
                        }
                    )
                    return
                    
            except asyncio.TimeoutError as e:
                logger.error(f"AI模型调用超时 - 会话ID: {conversation_id}: {str(e)}")
                error_occurred = True
                yield StreamChunk(
                    type="error",
                    content="AI响应超时，请稍后重试",
                    conversation_id=conversation_id,
                    metadata={
                        "error_type": "TimeoutError",
                        "error_category": "ai_model_timeout",
                        "processing_time": round(time.time() - start_time, 3)
                    }
                )
                return
                
            except ConnectionError as e:
                logger.error(f"AI模型连接错误 - 会话ID: {conversation_id}: {str(e)}")
                error_occurred = True
                yield StreamChunk(
                    type="error",
                    content="AI服务连接失败，请检查网络连接后重试",
                    conversation_id=conversation_id,
                    metadata={
                        "error_type": "ConnectionError",
                        "error_category": "network_error",
                        "processing_time": round(time.time() - start_time, 3)
                    }
                )
                return
                
            except ValueError as e:
                logger.error(f"AI模型参数错误 - 会话ID: {conversation_id}: {str(e)}")
                error_occurred = True
                
                # Handle authentication and parameter errors
                if "api_key" in str(e).lower() or "unauthorized" in str(e).lower() or "authentication" in str(e).lower():
                    error_message = "AI服务认证失败，请检查API密钥配置"
                    error_category = "authentication_error"
                elif "model" in str(e).lower() and "not found" in str(e).lower():
                    error_message = "AI模型不可用，请联系管理员"
                    error_category = "model_error"
                else:
                    error_message = "AI服务参数错误，请重试"
                    error_category = "parameter_error"
                
                yield StreamChunk(
                    type="error",
                    content=error_message,
                    conversation_id=conversation_id,
                    metadata={
                        "error_type": type(e).__name__,
                        "error_category": error_category,
                        "error_details": str(e)[:200],
                        "processing_time": round(time.time() - start_time, 3)
                    }
                )
                return
                
            except Exception as e:
                logger.error(f"AI模型调用失败 - 会话ID: {conversation_id}: {str(e)}", exc_info=True)
                error_occurred = True
                
                # Provide user-friendly error messages based on error type
                if "rate_limit" in str(e).lower() or "quota" in str(e).lower():
                    error_message = "AI服务请求频率过高，请稍后重试"
                    error_category = "rate_limit_error"
                else:
                    error_message = "AI服务暂时不可用，请稍后重试"
                    error_category = "ai_service_error"
                
                yield StreamChunk(
                    type="error",
                    content=error_message,
                    conversation_id=conversation_id,
                    metadata={
                        "error_type": type(e).__name__,
                        "error_category": error_category,
                        "error_details": str(e)[:200],  # Limit error details length
                        "processing_time": round(time.time() - start_time, 3)
                    }
                )
                return
            
            # 5. Update conversation state with complete response (thread-safe)
            try:
                if full_response and not error_occurred:
                    # Use thread-safe method to add AI response to conversation
                    ai_message = self._safe_add_message(
                        conversation_id, 
                        full_response, 
                        MessageType.AI,
                        metadata={
                            "streaming_session": True,
                            "chunk_count": chunk_index,
                            "processing_time": round(time.time() - start_time, 3),
                            "response_length": len(full_response)
                        }
                    )
                    logger.info(f"流式响应完成并保存到会话 - 会话ID: {conversation_id}, 总共{chunk_index}个块，响应长度: {len(full_response)}")
                    
            except Exception as e:
                logger.error(f"更新会话状态失败 - 会话ID: {conversation_id}: {str(e)}", exc_info=True)
                # Don't return error here as the response was successful, just log the issue
                # The streaming was successful, but we couldn't save the final state
                yield StreamChunk(
                    type="warning",
                    content="",
                    conversation_id=conversation_id,
                    metadata={
                        "warning_type": "state_save_failed",
                        "message": "响应生成成功，但保存会话状态时出现问题",
                        "processing_time": round(time.time() - start_time, 3)
                    }
                )
                
            # 6. Send end event
            if not error_occurred:
                processing_time = time.time() - start_time
                yield StreamChunk(
                    type="end",
                    content="",
                    conversation_id=conversation_id,
                    metadata={
                        "processing_time": round(processing_time, 3),
                        "total_chunks": chunk_index,
                        "full_response_length": len(full_response),
                        "status": "completed",
                        "conversation_updated": True
                    }
                )
            
        except asyncio.CancelledError:
            # Handle client disconnection gracefully
            logger.info(f"流式请求被取消 - 会话ID: {conversation_id}")
            yield StreamChunk(
                type="error",
                content="请求已取消",
                conversation_id=conversation_id,
                metadata={
                    "error_type": "CancelledError",
                    "error_category": "client_disconnection",
                    "processing_time": round(time.time() - start_time, 3)
                }
            )
            
        except Exception as e:
            # Catch-all for any unexpected errors
            logger.error(f"流式处理发生未预期错误 - 会话ID: {conversation_id}: {str(e)}", exc_info=True)
            yield StreamChunk(
                type="error",
                content="系统发生未预期错误，请重试或联系技术支持",
                conversation_id=conversation_id,
                metadata={
                    "error_type": type(e).__name__,
                    "error_category": "unexpected_error",
                    "error_details": str(e)[:200],
                    "processing_time": round(time.time() - start_time, 3)
                }
            )
    
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """
        Get a conversation by ID (thread-safe).
        """
        return self._safe_get_conversation(conversation_id)
    
    def get_conversation_history(self, conversation_id: str, limit: int = 10) -> List[Message]:
        """
        Get conversation history (thread-safe).
        """
        return self._safe_get_recent_messages(conversation_id, limit)
    
    def clear_conversation(self, conversation_id: str) -> bool:
        """
        Clear a conversation from memory (thread-safe).
        
        Args:
            conversation_id: The conversation identifier
            
        Returns:
            True if conversation was found and cleared, False otherwise
        """
        with self._conversation_lock:
            # Check if conversation is currently being streamed
            if conversation_id in self._active_streams:
                logger.warning(f"Cannot clear conversation {conversation_id} - streaming in progress")
                return False
                
            if conversation_id in self.conversations:
                del self.conversations[conversation_id]
                logger.info(f"Cleared conversation: {conversation_id}")
                return True
            return False
    
    def get_active_conversations_count(self) -> int:
        """
        Get the number of active conversations (thread-safe).
        
        Returns:
            Number of active conversations
        """
        with self._conversation_lock:
            return len(self.conversations)
    
    def get_streaming_conversations_count(self) -> int:
        """
        Get the number of conversations currently being streamed (thread-safe).
        
        Returns:
            Number of streaming conversations
        """
        with self._conversation_lock:
            return len(self._active_streams)
    
    def is_conversation_streaming(self, conversation_id: str) -> bool:
        """
        Check if a conversation is currently being streamed (thread-safe).
        
        Args:
            conversation_id: The conversation identifier
            
        Returns:
            True if conversation is currently streaming, False otherwise
        """
        with self._conversation_lock:
            return conversation_id in self._active_streams


# Global workflow instance
chat_workflow = ChatWorkflow()