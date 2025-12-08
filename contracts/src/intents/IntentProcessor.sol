// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IntentProcessor
 * @notice ERC-8004 inspired intent processor for AvaAgent
 * @dev Processes structured intents with verification and execution
 */
contract IntentProcessor is Ownable, ReentrancyGuard, Pausable {
    // ============================================================================
    // Types
    // ============================================================================

    enum IntentStatus {
        Pending,
        Verified,
        Executing,
        Completed,
        Failed,
        Cancelled
    }

    struct Intent {
        bytes32 id;
        address initiator;
        address agent;
        bytes32 intentType;
        bytes parameters;
        IntentStatus status;
        uint256 createdAt;
        uint256 executedAt;
        bytes result;
    }

    struct IntentExecution {
        address target;
        uint256 value;
        bytes data;
    }

    // ============================================================================
    // Events
    // ============================================================================

    event IntentCreated(
        bytes32 indexed intentId,
        address indexed initiator,
        address indexed agent,
        bytes32 intentType
    );

    event IntentVerified(bytes32 indexed intentId, address verifier);

    event IntentExecuted(
        bytes32 indexed intentId,
        bool success,
        bytes result
    );

    event IntentCancelled(bytes32 indexed intentId);

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    event ExecutorAdded(address indexed executor);
    event ExecutorRemoved(address indexed executor);

    // ============================================================================
    // State Variables
    // ============================================================================

    /// @notice Intent ID to intent mapping
    mapping(bytes32 => Intent) public intents;

    /// @notice User to intent IDs mapping
    mapping(address => bytes32[]) public userIntents;

    /// @notice Agent to intent IDs mapping
    mapping(address => bytes32[]) public agentIntents;

    /// @notice Authorized verifiers
    mapping(address => bool) public verifiers;

    /// @notice Authorized executors
    mapping(address => bool) public executors;

    /// @notice Intent nonce per user
    mapping(address => uint256) public intentNonces;

    /// @notice Total intents created
    uint256 public totalIntents;

    /// @notice Supported intent types
    mapping(bytes32 => bool) public supportedIntentTypes;

    // ============================================================================
    // Constructor
    // ============================================================================

    constructor() Ownable(msg.sender) {
        // Add default intent types
        supportedIntentTypes[keccak256("SWAP")] = true;
        supportedIntentTypes[keccak256("TRANSFER")] = true;
        supportedIntentTypes[keccak256("STAKE")] = true;
        supportedIntentTypes[keccak256("UNSTAKE")] = true;
        supportedIntentTypes[keccak256("BRIDGE")] = true;
        supportedIntentTypes[keccak256("PURCHASE")] = true;
        supportedIntentTypes[keccak256("DATA_FETCH")] = true;
    }

    // ============================================================================
    // External Functions
    // ============================================================================

    /**
     * @notice Create a new intent
     * @param agent Agent address to execute intent
     * @param intentType Type of intent (hashed)
     * @param parameters Encoded intent parameters
     * @return intentId The created intent ID
     */
    function createIntent(
        address agent,
        bytes32 intentType,
        bytes calldata parameters
    ) external whenNotPaused returns (bytes32 intentId) {
        require(agent != address(0), "Intent: zero agent");
        require(
            supportedIntentTypes[intentType],
            "Intent: unsupported type"
        );

        // Generate intent ID
        intentNonces[msg.sender]++;
        intentId = keccak256(
            abi.encodePacked(
                msg.sender,
                agent,
                intentType,
                intentNonces[msg.sender],
                block.timestamp
            )
        );

        // Create intent
        intents[intentId] = Intent({
            id: intentId,
            initiator: msg.sender,
            agent: agent,
            intentType: intentType,
            parameters: parameters,
            status: IntentStatus.Pending,
            createdAt: block.timestamp,
            executedAt: 0,
            result: ""
        });

        // Track intent
        userIntents[msg.sender].push(intentId);
        agentIntents[agent].push(intentId);
        totalIntents++;

        emit IntentCreated(intentId, msg.sender, agent, intentType);

        return intentId;
    }

    /**
     * @notice Verify an intent
     * @param intentId Intent identifier
     */
    function verifyIntent(bytes32 intentId) external {
        require(verifiers[msg.sender], "Intent: not verifier");
        require(_intentExists(intentId), "Intent: not found");
        require(
            intents[intentId].status == IntentStatus.Pending,
            "Intent: not pending"
        );

        intents[intentId].status = IntentStatus.Verified;

        emit IntentVerified(intentId, msg.sender);
    }

    /**
     * @notice Execute an intent
     * @param intentId Intent identifier
     * @param executions Array of execution calls
     */
    function executeIntent(
        bytes32 intentId,
        IntentExecution[] calldata executions
    ) external nonReentrant {
        require(
            executors[msg.sender] || msg.sender == owner(),
            "Intent: not executor"
        );
        require(_intentExists(intentId), "Intent: not found");
        
        Intent storage intent = intents[intentId];
        require(
            intent.status == IntentStatus.Verified ||
            intent.status == IntentStatus.Pending,
            "Intent: invalid status"
        );

        intent.status = IntentStatus.Executing;

        bool allSuccess = true;
        bytes memory lastResult;

        for (uint256 i = 0; i < executions.length; i++) {
            (bool success, bytes memory result) = executions[i].target.call{
                value: executions[i].value
            }(executions[i].data);

            if (!success) {
                allSuccess = false;
                lastResult = result;
                break;
            }
            lastResult = result;
        }

        if (allSuccess) {
            intent.status = IntentStatus.Completed;
        } else {
            intent.status = IntentStatus.Failed;
        }

        intent.executedAt = block.timestamp;
        intent.result = lastResult;

        emit IntentExecuted(intentId, allSuccess, lastResult);
    }

    /**
     * @notice Cancel a pending intent
     * @param intentId Intent identifier
     */
    function cancelIntent(bytes32 intentId) external {
        require(_intentExists(intentId), "Intent: not found");
        
        Intent storage intent = intents[intentId];
        require(
            intent.initiator == msg.sender || owner() == msg.sender,
            "Intent: not authorized"
        );
        require(
            intent.status == IntentStatus.Pending ||
            intent.status == IntentStatus.Verified,
            "Intent: cannot cancel"
        );

        intent.status = IntentStatus.Cancelled;

        emit IntentCancelled(intentId);
    }

    /**
     * @notice Get intent details
     * @param intentId Intent identifier
     * @return Intent struct
     */
    function getIntent(
        bytes32 intentId
    ) external view returns (Intent memory) {
        require(_intentExists(intentId), "Intent: not found");
        return intents[intentId];
    }

    /**
     * @notice Get intents for user
     * @param user User address
     * @return Array of intent IDs
     */
    function getIntentsForUser(
        address user
    ) external view returns (bytes32[] memory) {
        return userIntents[user];
    }

    /**
     * @notice Get intents for agent
     * @param agent Agent address
     * @return Array of intent IDs
     */
    function getIntentsForAgent(
        address agent
    ) external view returns (bytes32[] memory) {
        return agentIntents[agent];
    }

    // ============================================================================
    // Owner Functions
    // ============================================================================

    /**
     * @notice Add a verifier
     * @param verifier Verifier address
     */
    function addVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Intent: zero address");
        verifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }

    /**
     * @notice Remove a verifier
     * @param verifier Verifier address
     */
    function removeVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }

    /**
     * @notice Add an executor
     * @param executor Executor address
     */
    function addExecutor(address executor) external onlyOwner {
        require(executor != address(0), "Intent: zero address");
        executors[executor] = true;
        emit ExecutorAdded(executor);
    }

    /**
     * @notice Remove an executor
     * @param executor Executor address
     */
    function removeExecutor(address executor) external onlyOwner {
        executors[executor] = false;
        emit ExecutorRemoved(executor);
    }

    /**
     * @notice Add supported intent type
     * @param intentType Intent type hash
     */
    function addIntentType(bytes32 intentType) external onlyOwner {
        supportedIntentTypes[intentType] = true;
    }

    /**
     * @notice Remove supported intent type
     * @param intentType Intent type hash
     */
    function removeIntentType(bytes32 intentType) external onlyOwner {
        supportedIntentTypes[intentType] = false;
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================================================
    // Internal Functions
    // ============================================================================

    /**
     * @notice Check if intent exists
     */
    function _intentExists(bytes32 intentId) internal view returns (bool) {
        return intents[intentId].createdAt != 0;
    }

    // ============================================================================
    // Receive Function
    // ============================================================================

    receive() external payable {}
}
