#!/usr/bin/env python3
"""
环境变量配置测试脚本

用于验证环境变量是否正确加载和配置是否正常工作。
"""

import sys
import os

# 添加项目路径到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.config import settings
from app.chat.ai_providers import create_default_model


def test_config():
    """测试配置加载"""
    print("=== 环境变量配置测试 ===")
    print(f"应用名称: {settings.APP_NAME}")
    print(f"应用版本: {settings.APP_VERSION}")
    print(f"运行环境: {settings.APP_ENV}")
    print(f"服务器地址: {settings.HOST}:{settings.PORT}")
    print(f"日志级别: {settings.LOG_LEVEL}")
    print(f"是否开发环境: {settings.is_development}")
    print(f"是否生产环境: {settings.is_production}")
    print()
    
    print("=== CORS配置 ===")
    for origin in settings.ALLOWED_ORIGINS:
        print(f"允许的源: {origin}")
    print()
    
    print("=== AI模型配置 ===")
    ai_status = settings.get_ai_provider_status()
    print(f"Moonshot配置状态: {'✓' if ai_status['moonshot_configured'] else '✗'}")
    print(f"OpenAI配置状态: {'✓' if ai_status['openai_configured'] else '✗'}")
    print(f"Ollama服务地址: {ai_status['ollama_url']}")
    print(f"默认模型温度: {settings.DEFAULT_MODEL_TEMPERATURE}")
    print(f"默认最大重试次数: {settings.DEFAULT_MODEL_MAX_RETRIES}")
    print()


def test_ai_model_creation():
    """测试AI模型创建"""
    print("=== AI模型创建测试 ===")
    try:
        model = create_default_model()
        print(f"默认AI模型类型: {type(model).__name__}")
        
        # 获取模型信息
        import asyncio
        async def get_model_info():
            return await model.get_model_info()
        
        model_info = asyncio.run(get_model_info())
        print("模型信息:")
        for key, value in model_info.items():
            print(f"  {key}: {value}")
        
    except Exception as e:
        print(f"创建AI模型时出错: {str(e)}")
    print()


def main():
    """主函数"""
    print("开始环境变量配置测试...\n")
    
    test_config()
    test_ai_model_creation()
    
    print("环境变量配置测试完成！")


if __name__ == "__main__":
    main()