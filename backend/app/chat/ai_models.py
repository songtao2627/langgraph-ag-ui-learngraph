"""
AI模型接口模块，用于与不同的AI模型进行交互。

这个模块提供了与各种AI模型（如OpenAI、Ollama等）交互的接口，
将在任务3.2中完成实际的AI模型集成。
"""

from typing import List, Dict, Any, Optional, AsyncGenerator
from abc import ABC, abstractmethod
import asyncio

from langchain_core.messages import BaseMessage


class AIModelInterface(ABC):
    """
    AI模型接口的抽象基类。
    
    定义了所有AI模型实现必须提供的方法。
    """
    
    @abstractmethod
    async def generate_response(self, 
                               messages: List[BaseMessage], 
                               **kwargs) -> str:
        """
        生成AI响应。
        
        Args:
            messages: 对话历史消息列表
            **kwargs: 额外的模型参数
            
        Returns:
            生成的AI响应文本
        """
        pass
    
    @abstractmethod
    async def generate_response_stream(self, 
                                     messages: List[BaseMessage], 
                                     **kwargs) -> AsyncGenerator[str, None]:
        """
        生成流式AI响应。
        
        Args:
            messages: 对话历史消息列表
            **kwargs: 额外的模型参数
            
        Yields:
            AI响应的文本块
        """
        pass
    
    @abstractmethod
    async def get_model_info(self) -> Dict[str, Any]:
        """
        获取模型信息。
        
        Returns:
            包含模型信息的字典
        """
        pass


class MockAIModel(AIModelInterface):
    """
    模拟AI模型实现，用于测试和开发。
    
    提供了一个简单的模拟响应生成器，不需要实际的AI模型调用。
    """
    
    def __init__(self, model_name: str = "mock-model"):
        """
        初始化模拟AI模型。
        
        Args:
            model_name: 模型名称
        """
        self.model_name = model_name
        self.mock_responses = [
            "这是一个模拟的AI响应，用于测试对话流程。",
            "我理解您的问题，这里是一个模拟回答。",
            "作为一个模拟AI，我可以提供基本的回应功能。",
            "您的输入已被记录，这是一个预设的回复。",
            "这是测试环境中的自动回复，实际AI将提供更智能的回答。"
        ]
    
    async def generate_response(self, 
                               messages: List[BaseMessage], 
                               **kwargs) -> str:
        """
        生成模拟AI响应。
        
        Args:
            messages: 对话历史消息列表
            **kwargs: 额外的模型参数
            
        Returns:
            模拟的AI响应文本
        """
        # 简单地基于消息长度选择一个模拟响应
        if not messages:
            return self.mock_responses[0]
        
        last_message = messages[-1]
        content = last_message.content if hasattr(last_message, 'content') else ""
        
        # 基于输入内容的长度选择不同的模拟响应
        index = len(content) % len(self.mock_responses)
        response = self.mock_responses[index]
        
        # 如果是问候，添加问候语
        if any(greeting in content.lower() for greeting in ["你好", "hello", "hi", "嗨"]):
            response = f"你好！很高兴见到你。{response}"
        
        # 如果消息中包含问题，添加一个更具回应性的前缀
        if "?" in content or "？" in content:
            response = f"关于您的问题，{response}"
        
        return response
    
    async def generate_response_stream(self, 
                                     messages: List[BaseMessage], 
                                     **kwargs) -> AsyncGenerator[str, None]:
        """
        生成模拟流式AI响应。
        
        Args:
            messages: 对话历史消息列表
            **kwargs: 额外的模型参数
            
        Yields:
            模拟的AI响应文本块
        """
        # 首先生成完整响应
        full_response = await self.generate_response(messages, **kwargs)
        
        # 将响应分割成单词块来模拟流式输出
        words = full_response.split()
        
        for i, word in enumerate(words):
            # 模拟网络延迟
            await asyncio.sleep(0.1)  # 100ms延迟
            
            # 添加空格，除了第一个单词
            if i == 0:
                yield word
            else:
                yield f" {word}"
    
    async def get_model_info(self) -> Dict[str, Any]:
        """
        获取模拟模型信息。
        
        Returns:
            包含模型信息的字典
        """
        return {
            "model_name": self.model_name,
            "type": "mock",
            "capabilities": ["basic_conversation"],
            "is_mock": True
        }


# 默认模型实例
default_model = MockAIModel()