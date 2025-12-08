"""
AvaAgent Agent API Tests
"""

import pytest
from httpx import AsyncClient


class TestAgentsAPI:
    """Tests for the agents API endpoints."""

    @pytest.mark.asyncio
    async def test_create_agent(
        self, client: AsyncClient, auth_headers: dict, test_agent_data: dict
    ):
        """Test creating a new agent."""
        response = await client.post(
            "/api/v1/agents/",
            json=test_agent_data,
            headers=auth_headers,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == test_agent_data["name"]
        assert data["agent_type"] == test_agent_data["agent_type"]
        assert "id" in data

    @pytest.mark.asyncio
    async def test_get_agents(self, client: AsyncClient, auth_headers: dict):
        """Test listing agents."""
        response = await client.get(
            "/api/v1/agents/",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_get_agent_by_id(
        self, client: AsyncClient, auth_headers: dict, test_agent_data: dict
    ):
        """Test getting a specific agent by ID."""
        # First create an agent
        create_response = await client.post(
            "/api/v1/agents/",
            json=test_agent_data,
            headers=auth_headers,
        )
        agent_id = create_response.json()["id"]

        # Then retrieve it
        response = await client.get(
            f"/api/v1/agents/{agent_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == agent_id
        assert data["name"] == test_agent_data["name"]

    @pytest.mark.asyncio
    async def test_update_agent(
        self, client: AsyncClient, auth_headers: dict, test_agent_data: dict
    ):
        """Test updating an agent."""
        # First create an agent
        create_response = await client.post(
            "/api/v1/agents/",
            json=test_agent_data,
            headers=auth_headers,
        )
        agent_id = create_response.json()["id"]

        # Update the agent
        update_data = {"name": "Updated Agent Name"}
        response = await client.patch(
            f"/api/v1/agents/{agent_id}",
            json=update_data,
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Agent Name"

    @pytest.mark.asyncio
    async def test_delete_agent(
        self, client: AsyncClient, auth_headers: dict, test_agent_data: dict
    ):
        """Test deleting an agent."""
        # First create an agent
        create_response = await client.post(
            "/api/v1/agents/",
            json=test_agent_data,
            headers=auth_headers,
        )
        agent_id = create_response.json()["id"]

        # Delete the agent
        response = await client.delete(
            f"/api/v1/agents/{agent_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(
            f"/api/v1/agents/{agent_id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_agent_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting a non-existent agent."""
        response = await client.get(
            "/api/v1/agents/non-existent-id",
            headers=auth_headers,
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_agent_validation_error(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test creating agent with invalid data."""
        invalid_data = {
            "name": "",  # Empty name should fail
            "agent_type": "invalid_type",
        }
        
        response = await client.post(
            "/api/v1/agents/",
            json=invalid_data,
            headers=auth_headers,
        )
        
        assert response.status_code == 422


class TestAgentStatus:
    """Tests for agent status operations."""

    @pytest.mark.asyncio
    async def test_start_agent(
        self, client: AsyncClient, auth_headers: dict, test_agent_data: dict
    ):
        """Test starting an agent."""
        # Create agent
        create_response = await client.post(
            "/api/v1/agents/",
            json=test_agent_data,
            headers=auth_headers,
        )
        agent_id = create_response.json()["id"]

        # Start agent
        response = await client.post(
            f"/api/v1/agents/{agent_id}/start",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_stop_agent(
        self, client: AsyncClient, auth_headers: dict, test_agent_data: dict
    ):
        """Test stopping an agent."""
        # Create and start agent
        create_response = await client.post(
            "/api/v1/agents/",
            json=test_agent_data,
            headers=auth_headers,
        )
        agent_id = create_response.json()["id"]
        
        await client.post(
            f"/api/v1/agents/{agent_id}/start",
            headers=auth_headers,
        )

        # Stop agent
        response = await client.post(
            f"/api/v1/agents/{agent_id}/stop",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paused"
