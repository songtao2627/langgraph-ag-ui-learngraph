"""
Chat API routes.

This module defines the FastAPI routes for chat functionality.
Implements comprehensive error handling, request validation, and logging.
"""

import logging
import time
import json
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse
from datetime import datetime
from typing import Dict, Any, Optional

from ..models.chat import ChatRequest, ChatResponse, StreamChunk
from ..chat.workflow import chat_workflow

# 配置日志
logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter(
    prefix="/api/chat",
    tags=["聊天"],
    responses={
        400: {"description": "Bad request - Invalid input"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"},
        503: {"description": "Service unavailable"}
    }
)


@router.post("/stream")
async def chat_stream(request: ChatRequest, http_request: Request):
    """
    处理流式聊天请求并返回Server-Sent Events响应。
    
    Args:
        request: 包含用户消息和可选会话ID的请求
        http_request: FastAPI请求对象，用于获取客户端信息
        
    Returns:
        StreamingResponse with Server-Sent Events
        
    Raises:
        HTTPException: 如果请求处理失败
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    try:
        # 验证请求内容
        if not request.message or not request.message.strip():
            logger.warning(f"收到空消息请求 - IP: {client_ip}")
            raise HTTPException(
                status_code=400, 
                detail="Message cannot be empty"
            )
        
        logger.info(
            f"收到流式聊天请求 - IP: {client_ip}, "
            f"消息长度: {len(request.message)}, "
            f"会话ID: {request.conversation_id or 'new'}"
        )
        
        async def generate_sse():
            """生成Server-Sent Events格式的数据流"""
            try:
                async for chunk in chat_workflow.process_message_stream(request):
                    # 将StreamChunk转换为JSON
                    chunk_data = chunk.model_dump()
                    # 格式化为SSE格式
                    yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"
                    
            except Exception as e:
                # 发送错误事件
                error_chunk = StreamChunk(
                    type="error",
                    content=str(e),
                    conversation_id=request.conversation_id or "unknown",
                    metadata={"error_type": type(e).__name__}
                )
                yield f"data: {json.dumps(error_chunk.model_dump(), ensure_ascii=False)}\n\n"
        
        return StreamingResponse(
            generate_sse(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"流式聊天请求处理错误 - IP: {client_ip}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Internal server error - Unable to process streaming chat request"
        )


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, http_request: Request) -> ChatResponse:
    """
    处理聊天请求并返回AI响应。
    
    Args:
        request: 包含用户消息和可选会话ID的请求
        http_request: FastAPI请求对象，用于获取客户端信息
        
    Returns:
        AI响应和会话信息
        
    Raises:
        HTTPException: 如果请求处理失败
    """
    # 记录请求开始时间
    start_time = time.time()
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    try:
        # 记录请求信息
        logger.info(
            f"收到聊天请求 - IP: {client_ip}, "
            f"消息长度: {len(request.message)}, "
            f"会话ID: {request.conversation_id or 'new'}, "
            f"消息预览: {request.message[:50]}..."
        )
        
        # 验证请求内容
        if not request.message or not request.message.strip():
            logger.warning(f"收到空消息请求 - IP: {client_ip}")
            raise HTTPException(
                status_code=400, 
                detail="Message cannot be empty"
            )
        
        # 处理聊天请求
        response = await chat_workflow.process_message(request)
        
        # 计算处理时间
        processing_time = time.time() - start_time
        
        # 记录成功响应
        logger.info(
            f"聊天响应已生成 - IP: {client_ip}, "
            f"会话ID: {response.conversation_id}, "
            f"处理时间: {processing_time:.3f}s, "
            f"响应长度: {len(response.response)}"
        )
        
        return response
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
        
    except ValueError as e:
        # 处理验证错误
        logger.warning(f"请求验证错误 - IP: {client_ip}: {str(e)}")
        raise HTTPException(
            status_code=400, 
            detail=f"Validation error: {str(e)}"
        )
        
    except TimeoutError as e:
        # 处理超时错误
        logger.error(f"请求超时 - IP: {client_ip}: {str(e)}")
        raise HTTPException(
            status_code=503, 
            detail="Request timeout - AI service is temporarily unavailable"
        )
        
    except Exception as e:
        # 处理其他错误
        processing_time = time.time() - start_time
        logger.error(
            f"处理聊天请求时出错 - IP: {client_ip}, "
            f"处理时间: {processing_time:.3f}s, "
            f"错误: {str(e)}", 
            exc_info=True
        )
        raise HTTPException(
            status_code=500, 
            detail="Internal server error - Unable to process chat request"
        )


@router.get("/history/{conversation_id}")
async def get_conversation_history(
    conversation_id: str, 
    http_request: Request,
    limit: int = 10
) -> Dict[str, Any]:
    """
    获取指定会话的历史记录。
    
    Args:
        conversation_id: 会话ID
        limit: 返回的最大消息数量 (1-100)
        http_request: FastAPI请求对象
        
    Returns:
        包含会话历史的字典
        
    Raises:
        HTTPException: 如果参数无效或获取失败
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    try:
        # 验证参数
        if not conversation_id or not conversation_id.strip():
            logger.warning(f"无效的会话ID请求 - IP: {client_ip}")
            raise HTTPException(
                status_code=400, 
                detail="Conversation ID cannot be empty"
            )
        
        if limit < 1 or limit > 100:
            logger.warning(f"无效的limit参数 - IP: {client_ip}, limit: {limit}")
            raise HTTPException(
                status_code=400, 
                detail="Limit must be between 1 and 100"
            )
        
        logger.info(f"获取会话历史 - IP: {client_ip}, 会话ID: {conversation_id}, limit: {limit}")
        
        # 获取会话历史
        messages = chat_workflow.get_conversation_history(conversation_id, limit)
        
        result = {
            "conversation_id": conversation_id,
            "messages": [msg.to_dict() for msg in messages],
            "message_count": len(messages),
            "limit": limit,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"会话历史获取成功 - IP: {client_ip}, 会话ID: {conversation_id}, 消息数: {len(messages)}")
        return result
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
        
    except Exception as e:
        logger.error(f"获取会话历史时出错 - IP: {client_ip}, 会话ID: {conversation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Failed to retrieve conversation history"
        )


@router.delete("/history/{conversation_id}")
async def clear_conversation(conversation_id: str, http_request: Request) -> Dict[str, Any]:
    """
    清除指定会话的历史记录。
    
    Args:
        conversation_id: 会话ID
        http_request: FastAPI请求对象
        
    Returns:
        操作结果
        
    Raises:
        HTTPException: 如果参数无效或操作失败
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    try:
        # 验证参数
        if not conversation_id or not conversation_id.strip():
            logger.warning(f"无效的会话ID删除请求 - IP: {client_ip}")
            raise HTTPException(
                status_code=400, 
                detail="Conversation ID cannot be empty"
            )
        
        logger.info(f"清除会话历史请求 - IP: {client_ip}, 会话ID: {conversation_id}")
        
        # 尝试清除会话
        success = chat_workflow.clear_conversation(conversation_id)
        
        if success:
            logger.info(f"会话历史清除成功 - IP: {client_ip}, 会话ID: {conversation_id}")
            return {
                "status": "success",
                "message": f"Conversation {conversation_id} cleared successfully",
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            logger.warning(f"会话未找到 - IP: {client_ip}, 会话ID: {conversation_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Conversation {conversation_id} not found"
            )
            
    except HTTPException:
        # 重新抛出HTTP异常
        raise
        
    except Exception as e:
        logger.error(f"清除会话历史时出错 - IP: {client_ip}, 会话ID: {conversation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Failed to clear conversation history"
        )


@router.get("/conversations")
async def list_conversations(http_request: Request) -> Dict[str, Any]:
    """
    获取所有活跃会话的列表。
    
    Args:
        http_request: FastAPI请求对象
        
    Returns:
        包含会话列表的字典
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    try:
        logger.info(f"获取会话列表请求 - IP: {client_ip}")
        
        # 获取所有会话
        conversations = []
        for conv_id, conversation in chat_workflow.conversations.items():
            conversations.append({
                "conversation_id": conv_id,
                "message_count": len(conversation.messages),
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
                "last_message_preview": (
                    conversation.messages[-1].content[:50] + "..." 
                    if conversation.messages and len(conversation.messages[-1].content) > 50
                    else conversation.messages[-1].content if conversation.messages
                    else ""
                )
            })
        
        result = {
            "conversations": conversations,
            "total_count": len(conversations),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"会话列表获取成功 - IP: {client_ip}, 会话数: {len(conversations)}")
        return result
        
    except Exception as e:
        logger.error(f"获取会话列表时出错 - IP: {client_ip}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Failed to retrieve conversations list"
        )


@router.get("/health")
async def chat_service_health() -> Dict[str, Any]:
    """
    聊天服务健康检查端点。
    
    Returns:
        服务健康状态信息
    """
    try:
        # 检查AI模型状态
        model_info = await chat_workflow.ai_model.get_model_info()
        
        return {
            "status": "healthy",
            "service": "chat-service",
            "ai_model": model_info,
            "active_conversations": len(chat_workflow.conversations),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"聊天服务健康检查失败: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Chat service is unhealthy"
        )