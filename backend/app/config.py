"""
应用配置模块

统一管理应用的所有配置项，从环境变量中读取配置。
"""

import os
from typing import List, Optional
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class Settings:
    """应用设置类"""
    
    # 应用基础配置
    APP_NAME: str = "AI-UI Minimal Project Backend"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    
    # 服务器配置
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # CORS配置
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    ).split(",")
    
    # AI模型配置
    MOONSHOT_API_KEY: Optional[str] = os.getenv("MOONSHOT_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # 默认AI模型配置
    DEFAULT_MODEL_TEMPERATURE: float = float(os.getenv("DEFAULT_MODEL_TEMPERATURE", "0.7"))
    DEFAULT_MODEL_MAX_RETRIES: int = int(os.getenv("DEFAULT_MODEL_MAX_RETRIES", "3"))
    
    @property
    def is_development(self) -> bool:
        """判断是否为开发环境"""
        return self.APP_ENV.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """判断是否为生产环境"""
        return self.APP_ENV.lower() == "production"
    
    def get_ai_provider_status(self) -> dict:
        """获取AI提供者配置状态"""
        return {
            "moonshot_configured": bool(self.MOONSHOT_API_KEY),
            "openai_configured": bool(self.OPENAI_API_KEY),
            "ollama_url": self.OLLAMA_BASE_URL
        }


# 创建全局设置实例
settings = Settings()