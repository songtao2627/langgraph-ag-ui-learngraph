"""
LangGraph-based chat workflow implementation.

This module implements the core AI conversation workflow using LangGraph,
providing message processing, context management, and AI response generation.
"""

import time
import uuid
import logging
from typing import Dict, List, Optional, Any, TypedDict, AsyncGenerator
from datetime import datetime

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
    
    def _build_workflow(self) -> StateGraph:
        """
        Build the LangGraph workflow.
        
        Returns:
            Configured StateGraph workflow
        """
        # Create the workflow graph
        workflow = StateGraph(ChatState)
        
        # Add nodes to the workflow
        workflow.add_node("process_input", self._process_input_node)
        workflow.add_node("manage_context", self._manage_context_node)
        workflow.add_node("generate_response", self._generate_response_node)
        workflow.add_node("format_output", self._format_output_node)
        
        # Define the workflow edges
        workflow.set_entry_point("process_input")
        workflow.add_edge("process_input", "manage_context")
        workflow.add_edge("manage_context", "generate_response")
        workflow.add_edge("generate_response", "format_output")
        workflow.add_edge("format_output", END)
        
        # 返回未编译的工作流
        return workflow
    
    def _process_input_node(self, state: ChatState) -> ChatState:
        """
        Process and validate user input.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated state with processed input
        """
        # Record processing start time
        state["processing_start_time"] = time.time()
        
        # Validate input (basic validation)
        user_input = state.get("user_input", "").strip()
        if not user_input:
            raise ValueError("User input cannot be empty")
        
        # Ensure conversation_id exists
        if not state.get("conversation_id"):
            state["conversation_id"] = f"conv_{uuid.uuid4().hex[:12]}"
        
        # Initialize context if not present
        if "context" not in state:
            state["context"] = {}
        
        return state
    
    def _manage_context_node(self, state: ChatState) -> ChatState:
        """
        Manage conversation context and history.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated state with managed context
        """
        conversation_id = state["conversation_id"]
        user_input = state["user_input"]
        
        # Get or create conversation
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = Conversation(id=conversation_id)
        
        conversation = self.conversations[conversation_id]
        
        # Add user message to conversation
        user_message = conversation.add_message(
            content=user_input,
            message_type=MessageType.USER
        )
        
        # Convert messages to LangChain format for context
        langchain_messages = []
        for msg in conversation.messages:
            if msg.type == MessageType.USER:
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.type == MessageType.AI:
                langchain_messages.append(AIMessage(content=msg.content))
            elif msg.type == MessageType.SYSTEM:
                langchain_messages.append(SystemMessage(content=msg.content))
        
        # Update state with context information
        state["messages"] = [msg.to_dict() for msg in conversation.messages]
        state["context"] = {
            "conversation_length": len(conversation.messages),
            "last_user_message": user_input,
            "langchain_messages": langchain_messages
        }
        
        return state
    
    async def _generate_response_node(self, state: ChatState) -> ChatState:
        """
        Generate AI response using the configured AI model.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated state with AI response
        """
        user_input = state["user_input"]
        context = state["context"]
        langchain_messages = context.get("langchain_messages", [])
        
        try:
            # 记录开始时间，用于计算响应时间
            start_time = time.time()
            
            # 调用AI模型生成响应
            ai_response = await self.ai_model.generate_response(langchain_messages)
            
            # 记录响应时间
            response_time = time.time() - start_time
            logger.info(f"AI响应生成完成，耗时: {response_time:.2f}秒")
            
            # 更新状态
            state["ai_response"] = ai_response
            state["model_info"] = await self.ai_model.get_model_info()
            state["response_time"] = response_time
            
        except Exception as e:
            # 处理AI模型调用错误
            logger.error(f"AI响应生成失败: {str(e)}")
            state["ai_response"] = f"抱歉，我在处理您的请求时遇到了问题。错误信息: {str(e)}"
            state["error"] = str(e)
        
        return state
    
    def _format_output_node(self, state: ChatState) -> ChatState:
        """
        Format the final output response.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated state with formatted output
        """
        conversation_id = state["conversation_id"]
        ai_response = state["ai_response"]
        
        # Add AI message to conversation
        conversation = self.conversations[conversation_id]
        conversation.add_message(
            content=ai_response,
            message_type=MessageType.AI
        )
        
        # Calculate processing time
        processing_time = time.time() - state["processing_start_time"]
        
        # Update state with final formatted response
        state["final_response"] = ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            timestamp=datetime.utcnow(),
            processing_time=round(processing_time, 3)
        )
        
        return state
    
    async def async_setup(self):
        """异步设置和编译工作流"""
        logger.info("开始异步设置聊天工作流...")
        # 异步地构建和编译工作流
        self.workflow = self._build_workflow().compile()
        logger.info("聊天工作流已成功编译和设置")

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """
        Process a chat message through the LangGraph workflow.
        
        Args:
            request: Chat request containing user message and optional conversation ID
            
        Returns:
            Chat response with AI-generated reply
        """
        # Prepare initial state
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
            
            # 使用异步调用运行工作流
            final_state = await self.workflow.ainvoke(initial_state)
            return final_state["final_response"]
        
        except Exception as e:
            # 处理工作流错误
            import traceback
            logger.error(f"工作流错误: {str(e)}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            
            error_response = ChatResponse(
                response=f"抱歉，我在处理您的消息时遇到了问题: {str(e)}",
                conversation_id=initial_state["conversation_id"],
                timestamp=datetime.utcnow(),
                processing_time=0.0
            )
            return error_response
    
    async def process_message_stream(self, request: ChatRequest) -> AsyncGenerator[StreamChunk, None]:
        """
        Process a chat message and return streaming response.
        
        Args:
            request: Chat request containing user message and optional conversation ID
            
        Yields:
            Stream chunks containing AI response parts
        """
        conversation_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:12]}"
        start_time = time.time()
        
        try:
            # 发送开始信号
            yield StreamChunk(
                type="start",
                content="",
                conversation_id=conversation_id,
                metadata={"status": "processing"}
            )
            
            # 处理输入和上下文
            if conversation_id not in self.conversations:
                self.conversations[conversation_id] = Conversation(id=conversation_id)
            
            conversation = self.conversations[conversation_id]
            
            # 添加用户消息
            conversation.add_message(
                content=request.message,
                message_type=MessageType.USER
            )
            
            # 准备LangChain消息格式
            langchain_messages = []
            for msg in conversation.messages:
                if msg.type == MessageType.USER:
                    langchain_messages.append(HumanMessage(content=msg.content))
                elif msg.type == MessageType.AI:
                    langchain_messages.append(AIMessage(content=msg.content))
                elif msg.type == MessageType.SYSTEM:
                    langchain_messages.append(SystemMessage(content=msg.content))
            
            # 流式生成AI响应
            full_response = ""
            chunk_index = 0
            
            async for chunk in self.ai_model.generate_response_stream(langchain_messages):
                full_response += chunk
                chunk_index += 1
                
                yield StreamChunk(
                    type="chunk",
                    content=chunk,
                    conversation_id=conversation_id,
                    metadata={"chunk_index": chunk_index}
                )
            
            # 保存完整的AI响应到会话
            conversation.add_message(
                content=full_response,
                message_type=MessageType.AI
            )
            
            # 发送结束信号
            processing_time = time.time() - start_time
            yield StreamChunk(
                type="end",
                content="",
                conversation_id=conversation_id,
                metadata={
                    "processing_time": round(processing_time, 3),
                    "total_chunks": chunk_index,
                    "full_response": full_response
                }
            )
            
        except Exception as e:
            # 发送错误信号
            logger.error(f"流式处理错误: {str(e)}")
            yield StreamChunk(
                type="error",
                content=str(e),
                conversation_id=conversation_id,
                metadata={"error_type": type(e).__name__}
            )
    
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """
        Get a conversation by ID.
        
        Args:
            conversation_id: The conversation identifier
            
        Returns:
            Conversation object if found, None otherwise
        """
        return self.conversations.get(conversation_id)
    
    def get_conversation_history(self, conversation_id: str, limit: int = 10) -> List[Message]:
        """
        Get conversation history.
        
        Args:
            conversation_id: The conversation identifier
            limit: Maximum number of messages to return
            
        Returns:
            List of recent messages
        """
        conversation = self.conversations.get(conversation_id)
        if not conversation:
            return []
        
        return conversation.get_recent_messages(limit)
    
    def clear_conversation(self, conversation_id: str) -> bool:
        """
        Clear a conversation from memory.
        
        Args:
            conversation_id: The conversation identifier
            
        Returns:
            True if conversation was found and cleared, False otherwise
        """
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            return True
        return False


# Global workflow instance
chat_workflow = ChatWorkflow()