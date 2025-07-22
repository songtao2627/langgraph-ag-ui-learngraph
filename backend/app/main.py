"""
FastAPI应用入口
AG-UI最小化项目的后端服务
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
import sys
import os
from contextlib import asynccontextmanager

# 导入配置和路由
from .config import settings
from .routes import chat

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)

logger = logging.getLogger(__name__)

# 使用lifespan代替on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动事件
    logger.info("AG-UI Minimal Project Backend 正在启动...")
    await chat.chat_workflow.async_setup()
    logger.info("FastAPI应用已成功启动")
    
    yield  # 应用运行
    
    # 关闭事件
    logger.info("AG-UI Minimal Project Backend 正在关闭...")

# 创建FastAPI应用实例
app = FastAPI(
    title=settings.APP_NAME,
    description="基于LangGraph的AI对话后端服务",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS + ["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 配置受信任主机中间件（生产环境安全）
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.localhost"]
    )
    
# 注册路由
app.include_router(chat.router)

# 根路径端点
@app.get("/", tags=["基础"])
async def root():
    """根路径，返回应用基本信息"""
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.APP_ENV,
        "timestamp": datetime.now().isoformat()
    }

# 健康检查端点
@app.get("/api/health", tags=["监控"])
async def health_check():
    """健康检查端点，用于监控服务状态"""
    try:
        return {
            "status": "healthy",
            "service": "ag-ui-backend",
            "timestamp": datetime.now().isoformat(),
            "version": settings.APP_VERSION
        }
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": "Service unavailable",
                "timestamp": datetime.now().isoformat()
            }
        )

# 服务状态端点
@app.get("/api/status", tags=["监控"])
async def service_status():
    """详细的服务状态信息"""
    return {
        "service": "ag-ui-backend",
        "status": "running",
        "version": settings.APP_VERSION,
        "python_version": sys.version,
        "timestamp": datetime.now().isoformat(),
        "environment": settings.APP_ENV,
        "ai_providers": settings.get_ai_provider_status()
    }

# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    logger.error(f"未处理的异常: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "服务器内部错误，请稍后重试",
            "timestamp": datetime.now().isoformat()
        }
    )

# if __name__ == "__main__":
#     import asyncio
#     import sys
#     import uvicorn

#     # 解决uvicorn --reload在Windows上的兼容性问题
#     if sys.platform == "win32":
#         asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
#     uvicorn.run(
#         "app.main:app",
#         host=settings.HOST,
#         port=settings.PORT,
#         reload=settings.is_development,
#         log_level=settings.LOG_LEVEL.lower()
#     )