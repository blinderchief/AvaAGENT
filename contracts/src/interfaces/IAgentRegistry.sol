// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IAgentRegistry
 * @notice Interface for agent registry and discovery
 */
interface IAgentRegistry {
    /// @notice Agent status enum
    enum AgentStatus {
        Inactive,
        Active,
        Paused,
        Deprecated
    }

    /// @notice Agent info struct
    struct AgentInfo {
        address wallet;
        address owner;
        AgentStatus status;
        string metadataURI;
        uint256 createdAt;
        uint256 totalTasks;
        uint256 successfulTasks;
    }

    /// @notice Emitted when an agent is registered
    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed wallet,
        address indexed owner
    );

    /// @notice Emitted when agent status changes
    event AgentStatusChanged(
        bytes32 indexed agentId,
        AgentStatus oldStatus,
        AgentStatus newStatus
    );

    /// @notice Register a new agent
    function registerAgent(
        address wallet,
        string calldata metadataURI
    ) external returns (bytes32 agentId);

    /// @notice Get agent info
    function getAgent(bytes32 agentId) external view returns (AgentInfo memory);

    /// @notice Get agent ID by wallet address
    function getAgentByWallet(address wallet) external view returns (bytes32);

    /// @notice Check if agent exists
    function agentExists(bytes32 agentId) external view returns (bool);

    /// @notice Update agent status
    function updateStatus(bytes32 agentId, AgentStatus status) external;

    /// @notice Update agent metadata
    function updateMetadata(bytes32 agentId, string calldata metadataURI) external;
}
