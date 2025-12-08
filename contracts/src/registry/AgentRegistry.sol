// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAgentRegistry.sol";

/**
 * @title AgentRegistry
 * @notice Registry for AvaAgent autonomous agents
 * @dev Provides agent discovery, reputation tracking, and metadata management
 */
contract AgentRegistry is IAgentRegistry, Ownable, Pausable {
    // ============================================================================
    // State Variables
    // ============================================================================

    /// @notice Agent ID to agent info mapping
    mapping(bytes32 => AgentInfo) private _agents;

    /// @notice Wallet address to agent ID mapping
    mapping(address => bytes32) private _walletToAgent;

    /// @notice Owner address to agent IDs mapping
    mapping(address => bytes32[]) private _ownerAgents;

    /// @notice Total registered agents
    uint256 public totalAgents;

    /// @notice Agent nonce for unique ID generation
    uint256 private _agentNonce;

    // ============================================================================
    // Events
    // ============================================================================

    event TaskCompleted(
        bytes32 indexed agentId,
        bool success,
        uint256 totalTasks,
        uint256 successfulTasks
    );

    event MetadataUpdated(bytes32 indexed agentId, string newURI);

    // ============================================================================
    // Constructor
    // ============================================================================

    constructor() Ownable(msg.sender) {}

    // ============================================================================
    // External Functions
    // ============================================================================

    /**
     * @notice Register a new agent
     * @param wallet Agent's wallet address
     * @param metadataURI URI for agent metadata (IPFS or HTTP)
     * @return agentId Unique identifier for the agent
     */
    function registerAgent(
        address wallet,
        string calldata metadataURI
    ) external whenNotPaused returns (bytes32 agentId) {
        require(wallet != address(0), "Registry: zero address");
        require(_walletToAgent[wallet] == bytes32(0), "Registry: wallet registered");
        require(bytes(metadataURI).length > 0, "Registry: empty metadata");

        // Generate unique agent ID
        _agentNonce++;
        agentId = keccak256(
            abi.encodePacked(
                msg.sender,
                wallet,
                block.timestamp,
                _agentNonce
            )
        );

        // Create agent info
        _agents[agentId] = AgentInfo({
            wallet: wallet,
            owner: msg.sender,
            status: AgentStatus.Active,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            totalTasks: 0,
            successfulTasks: 0
        });

        // Update mappings
        _walletToAgent[wallet] = agentId;
        _ownerAgents[msg.sender].push(agentId);
        totalAgents++;

        emit AgentRegistered(agentId, wallet, msg.sender);

        return agentId;
    }

    /**
     * @notice Get agent information
     * @param agentId Agent identifier
     * @return Agent info struct
     */
    function getAgent(
        bytes32 agentId
    ) external view returns (AgentInfo memory) {
        require(agentExists(agentId), "Registry: agent not found");
        return _agents[agentId];
    }

    /**
     * @notice Get agent ID by wallet address
     * @param wallet Wallet address
     * @return Agent ID
     */
    function getAgentByWallet(
        address wallet
    ) external view returns (bytes32) {
        bytes32 agentId = _walletToAgent[wallet];
        require(agentId != bytes32(0), "Registry: wallet not registered");
        return agentId;
    }

    /**
     * @notice Check if agent exists
     * @param agentId Agent identifier
     * @return True if exists
     */
    function agentExists(bytes32 agentId) public view returns (bool) {
        return _agents[agentId].wallet != address(0);
    }

    /**
     * @notice Get all agents for an owner
     * @param owner Owner address
     * @return Array of agent IDs
     */
    function getAgentsByOwner(
        address owner
    ) external view returns (bytes32[] memory) {
        return _ownerAgents[owner];
    }

    /**
     * @notice Get agent count for an owner
     * @param owner Owner address
     * @return Number of agents
     */
    function getAgentCount(address owner) external view returns (uint256) {
        return _ownerAgents[owner].length;
    }

    /**
     * @notice Calculate agent reputation score
     * @param agentId Agent identifier
     * @return score Reputation score (0-100)
     */
    function getReputationScore(
        bytes32 agentId
    ) external view returns (uint256 score) {
        require(agentExists(agentId), "Registry: agent not found");
        
        AgentInfo memory agent = _agents[agentId];
        
        if (agent.totalTasks == 0) {
            return 50; // Default score for new agents
        }

        // Calculate success rate
        uint256 successRate = (agent.successfulTasks * 100) / agent.totalTasks;
        
        // Apply bonus for high task volume
        uint256 volumeBonus = 0;
        if (agent.totalTasks >= 100) {
            volumeBonus = 10;
        } else if (agent.totalTasks >= 50) {
            volumeBonus = 5;
        }

        score = successRate + volumeBonus;
        if (score > 100) score = 100;

        return score;
    }

    // ============================================================================
    // Owner-Only Functions
    // ============================================================================

    /**
     * @notice Update agent status
     * @param agentId Agent identifier
     * @param status New status
     */
    function updateStatus(
        bytes32 agentId,
        AgentStatus status
    ) external {
        require(agentExists(agentId), "Registry: agent not found");
        require(
            _agents[agentId].owner == msg.sender || owner() == msg.sender,
            "Registry: not authorized"
        );

        AgentStatus oldStatus = _agents[agentId].status;
        _agents[agentId].status = status;

        emit AgentStatusChanged(agentId, oldStatus, status);
    }

    /**
     * @notice Update agent metadata
     * @param agentId Agent identifier
     * @param metadataURI New metadata URI
     */
    function updateMetadata(
        bytes32 agentId,
        string calldata metadataURI
    ) external {
        require(agentExists(agentId), "Registry: agent not found");
        require(
            _agents[agentId].owner == msg.sender,
            "Registry: not owner"
        );
        require(bytes(metadataURI).length > 0, "Registry: empty metadata");

        _agents[agentId].metadataURI = metadataURI;

        emit MetadataUpdated(agentId, metadataURI);
    }

    /**
     * @notice Record task completion
     * @param agentId Agent identifier
     * @param success Whether task was successful
     */
    function recordTask(
        bytes32 agentId,
        bool success
    ) external {
        require(agentExists(agentId), "Registry: agent not found");
        require(
            _agents[agentId].owner == msg.sender || 
            _agents[agentId].wallet == msg.sender ||
            owner() == msg.sender,
            "Registry: not authorized"
        );

        _agents[agentId].totalTasks++;
        if (success) {
            _agents[agentId].successfulTasks++;
        }

        emit TaskCompleted(
            agentId,
            success,
            _agents[agentId].totalTasks,
            _agents[agentId].successfulTasks
        );
    }

    // ============================================================================
    // Admin Functions
    // ============================================================================

    /**
     * @notice Pause registry
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause registry
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
