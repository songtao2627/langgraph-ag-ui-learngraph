"""
AI模型提供者实现模块。

这个模块提供了与不同AI服务提供商（如OpenAI、Ollama）的集成实现。
"""

import os
import time
import logging
from typing import List, Dict, Any, Optional, Union

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain.callbacks.base import BaseCallbackHandler

from .ai_models import AIModelInterface
from ..config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RetryHandler(BaseCallbackHandler):
    """
    重试处理器，用于处理AI模型调用中的错误和重试逻辑。
    """
    
    def __init__(self, max_retries: int = 3):
        """
        初始化重试处理器。
        
        Args:
            max_retries: 最大重试次数
        """
        self.max_retries = max_retries
        self.current_retry = 0
        self.errors = []
    
    def on_llm_error(self, error: Union[Exception, KeyboardInterrupt], **kwargs) -> None:
        """
        当LLM调用出错时的回调。
        
        Args:
            error: 发生的错误
            **kwargs: 额外参数
        """
        self.errors.append(str(error))
        self.current_retry += 1
        if self.current_retry <= self.max_retries:
            logger.warning(f"AI模型调用失败，正在进行第{self.current_retry}次重试。错误: {error}")
            time.sleep(1 * self.current_retry)  # 指数退避
        else:
            logger.error(f"AI模型调用失败，已达到最大重试次数({self.max_retries})。")
    
    def reset(self):
        """重置重试计数和错误列表。"""
        self.current_retry = 0
        self.errors = []


class OpenAIModel(AIModelInterface):
    """
    OpenAI模型实现。
    
    使用LangChain的ChatOpenAI集成OpenAI的模型。
    """
    
    def __init__(self, 
                model_name: str = "gpt-3.5-turbo", 
                temperature: float = None,
                max_retries: int = None):
        """
        初始化OpenAI模型。
        
        Args:
            model_name: OpenAI模型名称
            temperature: 生成温度，控制随机性
            max_retries: 最大重试次数
        """
        # 使用配置中的默认值
        if temperature is None:
            temperature = settings.DEFAULT_MODEL_TEMPERATURE
        if max_retries is None:
            max_retries = settings.DEFAULT_MODEL_MAX_RETRIES
            
        # 检查API密钥是否设置
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            logger.warning("未设置OPENAI_API_KEY环境变量，OpenAI模型可能无法正常工作")
        
        self.model_name = model_name
        self.temperature = temperature
        self.retry_handler = RetryHandler(max_retries=max_retries)
        
        # 初始化LangChain的ChatOpenAI
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature,
            callbacks=[self.retry_handler]
        )
    
    async def generate_response(self, 
                               messages: List[BaseMessage], 
                               **kwargs) -> str:
        """
        使用OpenAI生成响应。
        
        Args:
            messages: 对话历史消息列表
            **kwargs: 额外的模型参数
            
        Returns:
            生成的AI响应文本
        """
        try:
            # 重置重试处理器
            self.retry_handler.reset()
            
            # 应用任何覆盖参数
            temperature = kwargs.get("temperature", self.temperature)
            model = kwargs.get("model", self.model_name)
            
            # 如果模型或温度发生变化，重新创建LLM实例
            if model != self.model_name or temperature != self.temperature:
                self.llm = ChatOpenAI(
                    model_name=model,
                    temperature=temperature,
                    callbacks=[self.retry_handler]
                )
            
            # 调用模型生成响应
            response = await self.llm.ainvoke(messages)
            return response.content
            
        except Exception as e:
            logger.error(f"OpenAI模型调用失败: {str(e)}")
            if self.retry_handler.errors:
                error_details = ", ".join(self.retry_handler.errors)
                return f"抱歉，AI模型暂时无法响应。错误详情: {error_details}"
            return "抱歉，AI模型暂时无法响应。请稍后再试。"
    
    async def get_model_info(self) -> Dict[str, Any]:
        """
        获取OpenAI模型信息。
        
        Returns:
            包含模型信息的字典
        """
        return {
            "provider": "OpenAI",
            "model_name": self.model_name,
            "temperature": self.temperature,
            "api_configured": bool(self.api_key)
        }


class OllamaModel(AIModelInterface):
    """
    Ollama模型实现。
    
    使用LangChain的ChatOllama集成本地Ollama模型。
    """
    
    def __init__(self, 
                model_name: str = "llama2", 
                temperature: float = None,
                base_url: str = None,
                max_retries: int = None):
        """
        初始化Ollama模型。
        
        Args:
            model_name: Ollama模型名称
            temperature: 生成温度，控制随机性
            base_url: Ollama服务的基础URL
            max_retries: 最大重试次数
        """
        # 使用配置中的默认值
        if temperature is None:
            temperature = settings.DEFAULT_MODEL_TEMPERATURE
        if base_url is None:
            base_url = settings.OLLAMA_BASE_URL
        if max_retries is None:
            max_retries = settings.DEFAULT_MODEL_MAX_RETRIES
            
        self.model_name = model_name
        self.temperature = temperature
        self.base_url = base_url
        self.retry_handler = RetryHandler(max_retries=max_retries)
        
        # 初始化LangChain的ChatOllama
        self.llm = ChatOllama(
            model=model_name,
            temperature=temperature,
            base_url=base_url,
            callbacks=[self.retry_handler]
        )
    
    async def generate_response(self, 
                               messages: List[BaseMessage], 
                               **kwargs) -> str:
        """
        使用Ollama生成响应。
        
        Args:
            messages: 对话历史消息列表
            **kwargs: 额外的模型参数
            
        Returns:
            生成的AI响应文本
        """
        try:
            # 重置重试处理器
            self.retry_handler.reset()
            
            # 应用任何覆盖参数
            temperature = kwargs.get("temperature", self.temperature)
            model = kwargs.get("model", self.model_name)
            
            # 如果模型或温度发生变化，重新创建LLM实例
            if model != self.model_name or temperature != self.temperature:
                self.llm = ChatOllama(
                    model=model,
                    temperature=temperature,
                    base_url=self.base_url,
                    callbacks=[self.retry_handler]
                )
            
            # 调用模型生成响应
            response = await self.llm.ainvoke(messages)
            return response.content
            
        except Exception as e:
            logger.error(f"Ollama模型调用失败: {str(e)}")
            if self.retry_handler.errors:
                error_details = ", ".join(self.retry_handler.errors)
                return f"抱歉，本地AI模型暂时无法响应。错误详情: {error_details}"
            return "抱歉，本地AI模型暂时无法响应。请确保Ollama服务正在运行。"
    
    async def get_model_info(self) -> Dict[str, Any]:
        """
        获取Ollama模型信息。
        
        Returns:
            包含模型信息的字典
        """
        return {
            "provider": "Ollama",
            "model_name": self.model_name,
            "temperature": self.temperature,
            "base_url": self.base_url
        }


class MoonshotModel(AIModelInterface):
    """
    Moonshot (Kimi) 模型实现。
    
    使用LangChain的ChatOpenAI集成Moonshot的Kimi模型。
    """
    
    def __init__(self, 
                model_name: str = "kimi-k2-0711-preview", 
                temperature: float = None,
                max_retries: int = None):
        """
        初始化Moonshot模型。
        
        Args:
            model_name: Moonshot模型名称
            temperature: 生成温度，控制随机性
            max_retries: 最大重试次数
        """
        # 使用配置中的默认值
        if temperature is None:
            temperature = settings.DEFAULT_MODEL_TEMPERATURE
        if max_retries is None:
            max_retries = settings.DEFAULT_MODEL_MAX_RETRIES
            
        # 检查API密钥是否设置
        self.api_key = settings.MOONSHOT_API_KEY
        if not self.api_key:
            logger.warning("未设置MOONSHOT_API_KEY环境变量，Moonshot模型可能无法正常工作")
        
        self.model_name = model_name
        self.temperature = temperature
        self.retry_handler = RetryHandler(max_retries=max_retries)
        
        # 初始化LangChain的ChatOpenAI，使用Moonshot的API端点
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature,
            openai_api_key=self.api_key,
            openai_api_base="https://api.moonshot.cn/v1",
            callbacks=[self.retry_handler]
        )
    
    async def generate_response(self, 
                               messages: List[BaseMessage], 
                               **kwargs) -> str:
        """
        使用Moonshot生成响应。
        
        Args:
            messages: 对话历史消息列表
            **kwargs: 额外的模型参数
            
        Returns:
            生成的AI响应文本
        """
        try:
            # 重置重试处理器
            self.retry_handler.reset()
            
            # 应用任何覆盖参数
            temperature = kwargs.get("temperature", self.temperature)
            model = kwargs.get("model", self.model_name)
            
            # 如果模型或温度发生变化，重新创建LLM实例
            if model != self.model_name or temperature != self.temperature:
                self.llm = ChatOpenAI(
                    model_name=model,
                    temperature=temperature,
                    openai_api_key=self.api_key,
                    openai_api_base="https://api.moonshot.cn/v1",
                    callbacks=[self.retry_handler]
                )
            
            # 调用模型生成响应
            response = await self.llm.ainvoke(messages)
            return response.content
            
        except Exception as e:
            logger.error(f"Moonshot模型调用失败: {str(e)}")
            if self.retry_handler.errors:
                error_details = ", ".join(self.retry_handler.errors)
                return f"抱歉，Moonshot AI模型暂时无法响应。错误详情: {error_details}"
            return "抱歉，Moonshot AI模型暂时无法响应。请稍后再试。"
    
    async def get_model_info(self) -> Dict[str, Any]:
        """
        获取Moonshot模型信息。
        
        Returns:
            包含模型信息的字典
        """
        return {
            "provider": "Moonshot",
            "model_name": self.model_name,
            "temperature": self.temperature,
            "api_configured": bool(self.api_key),
            "api_base": "https://api.moonshot.cn/v1"
        }


# 创建默认模型实例
def create_default_model() -> AIModelInterface:
    """
    创建默认AI模型实例。
    
    根据环境配置选择合适的模型实现。
    
    Returns:
        AIModelInterface实例
    """
    # 检查是否配置了Moonshot API密钥
    if settings.MOONSHOT_API_KEY:
        logger.info("使用Moonshot模型作为默认AI提供者")
        return MoonshotModel()
    
    # 检查是否配置了OpenAI API密钥
    if settings.OPENAI_API_KEY:
        logger.info("使用OpenAI模型作为默认AI提供者")
        return OpenAIModel()
    
    # 检查是否可以连接到Ollama服务
    try:
        import httpx
        with httpx.Client() as client:
            response = client.get(f"{settings.OLLAMA_BASE_URL}/api/version", timeout=2.0)
            if response.status_code == 200:
                logger.info("使用Ollama模型作为默认AI提供者")
                return OllamaModel()
    except Exception as e:
        logger.warning(f"无法连接到Ollama服务: {str(e)}")
    
    # 如果以上都不可用，使用模拟模型
    logger.info("使用模拟AI模型作为默认AI提供者")
    from .ai_models import MockAIModel
    return MockAIModel()


# 便捷函数用于创建特定模型实例
def create_moonshot_model(model_name: str = "kimi-k2-0711-preview", 
                         temperature: float = None) -> MoonshotModel:
    """
    创建Moonshot模型实例。
    
    Args:
        model_name: 模型名称
        temperature: 生成温度，None时使用配置默认值
        
    Returns:
        MoonshotModel实例
    """
    return MoonshotModel(model_name=model_name, temperature=temperature)


def create_openai_model(model_name: str = "gpt-3.5-turbo", 
                       temperature: float = None) -> OpenAIModel:
    """
    创建OpenAI模型实例。
    
    Args:
        model_name: 模型名称
        temperature: 生成温度，None时使用配置默认值
        
    Returns:
        OpenAIModel实例
    """
    return OpenAIModel(model_name=model_name, temperature=temperature)


def create_ollama_model(model_name: str = "llama2", 
                       temperature: float = None,
                       base_url: str = None) -> OllamaModel:
    """
    创建Ollama模型实例。
    
    Args:
        model_name: 模型名称
        temperature: 生成温度，None时使用配置默认值
        base_url: Ollama服务URL，None时使用配置默认值
        
    Returns:
        OllamaModel实例
    """
    return OllamaModel(model_name=model_name, temperature=temperature, base_url=base_url)