"""
AI Service - Gemini Integration

Provides AI inference capabilities using Google's Gemini models.
"""

import json
from typing import Any, AsyncGenerator, Optional

import google.generativeai as genai
from google.generativeai.types import GenerationConfig, HarmCategory, HarmBlockThreshold

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


class AIService:
    """
    AI inference service using Gemini.
    
    Supports both synchronous and streaming responses with
    function calling for agent tool use.
    """
    
    def __init__(self):
        genai.configure(api_key=settings.google_api_key)
        
        # Initialize models
        self.pro_model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            generation_config=self._get_generation_config(),
            safety_settings=self._get_safety_settings(),
        )
        
        self.flash_model = genai.GenerativeModel(
            model_name=settings.gemini_flash_model,
            generation_config=self._get_generation_config(fast=True),
            safety_settings=self._get_safety_settings(),
        )
    
    def _get_generation_config(self, fast: bool = False) -> GenerationConfig:
        """Get generation configuration."""
        return GenerationConfig(
            temperature=0.4 if fast else settings.ai_temperature,
            top_p=0.95,
            top_k=64,
            max_output_tokens=4096 if fast else settings.ai_max_tokens,
        )
    
    def _get_safety_settings(self) -> dict:
        """Get safety settings - configured for financial/trading context."""
        return {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[list[dict]] = None,
        use_flash: bool = False,
        tools: Optional[list[dict]] = None,
    ) -> dict[str, Any]:
        """
        Generate AI response.
        
        Args:
            prompt: User prompt
            system_prompt: System instructions
            context: Conversation history
            use_flash: Use faster model
            tools: Function definitions for tool calling
            
        Returns:
            Response with text and metadata
        """
        model = self.flash_model if use_flash else self.pro_model
        
        # Build messages
        messages = []
        
        if system_prompt:
            messages.append({"role": "user", "parts": [f"[System]: {system_prompt}"]})
            messages.append({"role": "model", "parts": ["Understood. I'll follow these instructions."]})
        
        if context:
            for msg in context:
                messages.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]]
                })
        
        messages.append({"role": "user", "parts": [prompt]})
        
        try:
            # Create chat session
            chat = model.start_chat(history=messages[:-1] if len(messages) > 1 else [])
            
            # Generate response
            response = await chat.send_message_async(
                messages[-1]["parts"][0],
                tools=tools if tools else None,
            )
            
            # Extract response data
            result = {
                "text": response.text,
                "tokens": {
                    "prompt": response.usage_metadata.prompt_token_count,
                    "completion": response.usage_metadata.candidates_token_count,
                    "total": response.usage_metadata.total_token_count,
                },
                "finish_reason": str(response.candidates[0].finish_reason) if response.candidates else None,
            }
            
            # Check for function calls
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "function_call"):
                        result["function_call"] = {
                            "name": part.function_call.name,
                            "arguments": dict(part.function_call.args),
                        }
            
            logger.info(
                "ai_generation_complete",
                tokens=result["tokens"]["total"],
                model=settings.gemini_flash_model if use_flash else settings.gemini_model,
            )
            
            return result
            
        except Exception as e:
            logger.error("ai_generation_error", error=str(e))
            raise
    
    async def stream_generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[list[dict]] = None,
        use_flash: bool = False,
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response tokens.
        
        Yields text chunks as they are generated.
        """
        model = self.flash_model if use_flash else self.pro_model
        
        # Build messages
        messages = []
        
        if system_prompt:
            messages.append({"role": "user", "parts": [f"[System]: {system_prompt}"]})
            messages.append({"role": "model", "parts": ["Understood."]})
        
        if context:
            for msg in context:
                messages.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]]
                })
        
        messages.append({"role": "user", "parts": [prompt]})
        
        try:
            chat = model.start_chat(history=messages[:-1] if len(messages) > 1 else [])
            response = await chat.send_message_async(
                messages[-1]["parts"][0],
                stream=True,
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error("ai_stream_error", error=str(e))
            raise
    
    async def analyze_intent(
        self,
        user_message: str,
        agent_capabilities: list[str],
        available_actions: list[str],
    ) -> dict[str, Any]:
        """
        Analyze user message to determine agent intent.
        
        Returns structured intent for execution.
        """
        system_prompt = f"""You are an AI agent intent analyzer for the AvaAgent platform.
        
Available agent capabilities: {json.dumps(agent_capabilities)}
Available actions: {json.dumps(available_actions)}

Analyze the user's message and extract:
1. intent_type: The type of action requested
2. parameters: Structured parameters for the action
3. confidence: Your confidence level (0-1)
4. reasoning: Brief explanation

Respond in JSON format only."""

        response = await self.generate(
            prompt=user_message,
            system_prompt=system_prompt,
            use_flash=True,
        )
        
        try:
            # Parse JSON from response
            text = response["text"]
            # Handle code blocks
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            return json.loads(text.strip())
        except json.JSONDecodeError:
            logger.warning("intent_parse_failed", response=response["text"])
            return {
                "intent_type": "unknown",
                "parameters": {},
                "confidence": 0,
                "reasoning": response["text"],
            }
    
    async def generate_transaction_plan(
        self,
        intent: dict[str, Any],
        wallet_balance: dict[str, str],
        market_data: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Generate execution plan for an intent.
        
        Creates a step-by-step transaction plan with risk analysis.
        """
        system_prompt = """You are an AI transaction planner for DeFi operations.

Given an intent and wallet state, create an execution plan with:
1. steps: Array of transaction steps in order
2. estimated_gas_usd: Total estimated gas cost
3. estimated_value_usd: Total value being transacted
4. risks: Potential risks and mitigations
5. alternatives: Alternative approaches if primary fails

Respond in JSON format only."""

        prompt = f"""Intent: {json.dumps(intent)}
Wallet Balance: {json.dumps(wallet_balance)}
Market Data: {json.dumps(market_data) if market_data else 'Not available'}

Generate execution plan:"""

        response = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
        )
        
        try:
            text = response["text"]
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return {"error": "Failed to parse plan", "raw": response["text"]}


# Singleton instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    """Get AI service singleton."""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
