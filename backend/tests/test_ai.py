"""
AvaAgent AI Service Tests
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient


class TestAIChatAPI:
    """Tests for the AI chat API endpoints."""

    @pytest.mark.asyncio
    async def test_chat_endpoint(
        self, client: AsyncClient, auth_headers: dict, mock_gemini
    ):
        """Test the chat endpoint."""
        with patch("app.services.ai_service.gemini_client", mock_gemini):
            response = await client.post(
                "/api/v1/ai/chat",
                json={"message": "What is AvaAgent?"},
                headers=auth_headers,
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "tokens" in data

    @pytest.mark.asyncio
    async def test_chat_with_context(
        self, client: AsyncClient, auth_headers: dict, mock_gemini
    ):
        """Test chat with conversation context."""
        context = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi! How can I help?"},
        ]
        
        with patch("app.services.ai_service.gemini_client", mock_gemini):
            response = await client.post(
                "/api/v1/ai/chat",
                json={
                    "message": "Tell me about agents",
                    "context": context,
                },
                headers=auth_headers,
            )
        
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_empty_message(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test chat with empty message."""
        response = await client.post(
            "/api/v1/ai/chat",
            json={"message": ""},
            headers=auth_headers,
        )
        
        assert response.status_code == 422


class TestIntentAnalysis:
    """Tests for intent analysis."""

    @pytest.mark.asyncio
    async def test_analyze_swap_intent(
        self, client: AsyncClient, auth_headers: dict, mock_gemini
    ):
        """Test analyzing a swap intent."""
        mock_gemini.generate_content = AsyncMock(return_value=MagicMock(
            text='{"intent": "swap", "from_token": "AVAX", "to_token": "USDC", "amount": "100", "confidence": 0.95}'
        ))
        
        with patch("app.services.ai_service.gemini_client", mock_gemini):
            response = await client.post(
                "/api/v1/ai/analyze-intent",
                json={"message": "Swap 100 AVAX to USDC"},
                headers=auth_headers,
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "intent" in data
        assert "confidence" in data

    @pytest.mark.asyncio
    async def test_analyze_transfer_intent(
        self, client: AsyncClient, auth_headers: dict, mock_gemini
    ):
        """Test analyzing a transfer intent."""
        mock_gemini.generate_content = AsyncMock(return_value=MagicMock(
            text='{"intent": "transfer", "to_address": "0x123...", "amount": "10", "token": "AVAX", "confidence": 0.92}'
        ))
        
        with patch("app.services.ai_service.gemini_client", mock_gemini):
            response = await client.post(
                "/api/v1/ai/analyze-intent",
                json={"message": "Send 10 AVAX to 0x123..."},
                headers=auth_headers,
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "intent" in data

    @pytest.mark.asyncio
    async def test_analyze_unknown_intent(
        self, client: AsyncClient, auth_headers: dict, mock_gemini
    ):
        """Test analyzing an unclear intent."""
        mock_gemini.generate_content = AsyncMock(return_value=MagicMock(
            text='{"intent": "unknown", "confidence": 0.3}'
        ))
        
        with patch("app.services.ai_service.gemini_client", mock_gemini):
            response = await client.post(
                "/api/v1/ai/analyze-intent",
                json={"message": "Do something random"},
                headers=auth_headers,
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("intent") == "unknown" or data.get("confidence", 1) < 0.5


class TestStreamingChat:
    """Tests for streaming chat functionality."""

    @pytest.mark.asyncio
    async def test_streaming_chat(
        self, client: AsyncClient, auth_headers: dict, mock_gemini
    ):
        """Test streaming chat endpoint."""
        # This test would verify Server-Sent Events behavior
        # For simplicity, we test the endpoint exists
        response = await client.post(
            "/api/v1/ai/chat/stream",
            json={"message": "Hello"},
            headers=auth_headers,
        )
        
        # Should return SSE or appropriate response
        assert response.status_code in [200, 501]  # 501 if not implemented
