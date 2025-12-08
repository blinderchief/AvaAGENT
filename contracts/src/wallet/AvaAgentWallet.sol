// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAvaAgentWallet.sol";

/**
 * @title AvaAgentWallet
 * @notice Smart contract wallet for AvaAgent autonomous agents
 * @dev Implements spending limits, operator controls, and batch execution
 */
contract AvaAgentWallet is IAvaAgentWallet, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============================================================================
    // State Variables
    // ============================================================================

    /// @notice Mapping of operator addresses
    mapping(address => bool) private _operators;

    /// @notice Daily spending limit in native token (wei)
    uint256 public override spendingLimit;

    /// @notice Amount spent in current period
    uint256 public override currentSpent;

    /// @notice Timestamp of last spending reset
    uint256 public lastResetTime;

    /// @notice Spending reset period (default 24 hours)
    uint256 public constant RESET_PERIOD = 24 hours;

    /// @notice Maximum operators allowed
    uint256 public constant MAX_OPERATORS = 10;

    /// @notice Current operator count
    uint256 public operatorCount;

    /// @notice Whitelisted contracts for interaction
    mapping(address => bool) public whitelistedTargets;

    /// @notice Whether whitelist is enforced
    bool public whitelistEnabled;

    // ============================================================================
    // Constructor
    // ============================================================================

    constructor(
        address _owner,
        uint256 _spendingLimit
    ) Ownable(_owner) {
        spendingLimit = _spendingLimit;
        lastResetTime = block.timestamp;
    }

    // ============================================================================
    // Modifiers
    // ============================================================================

    modifier onlyOperatorOrOwner() {
        require(
            _operators[msg.sender] || msg.sender == owner(),
            "AvaAgentWallet: not authorized"
        );
        _;
    }

    modifier withinSpendingLimit(uint256 amount) {
        _checkAndResetSpending();
        require(
            currentSpent + amount <= spendingLimit,
            "AvaAgentWallet: spending limit exceeded"
        );
        _;
    }

    modifier validTarget(address target) {
        if (whitelistEnabled) {
            require(
                whitelistedTargets[target],
                "AvaAgentWallet: target not whitelisted"
            );
        }
        _;
    }

    // ============================================================================
    // External Functions
    // ============================================================================

    /**
     * @notice Execute a single transaction
     * @param to Target address
     * @param value ETH value to send
     * @param data Call data
     * @return result The return data from the call
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    )
        external
        override
        onlyOperatorOrOwner
        nonReentrant
        withinSpendingLimit(value)
        validTarget(to)
        returns (bytes memory result)
    {
        currentSpent += value;

        (bool success, bytes memory returnData) = to.call{value: value}(data);
        
        emit TransactionExecuted(to, value, data, success);

        if (!success) {
            // Bubble up the revert reason
            if (returnData.length > 0) {
                assembly {
                    let returndata_size := mload(returnData)
                    revert(add(32, returnData), returndata_size)
                }
            }
            revert("AvaAgentWallet: execution failed");
        }

        return returnData;
    }

    /**
     * @notice Execute multiple transactions in batch
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param datas Array of call data
     * @return results Array of return data
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    )
        external
        override
        onlyOperatorOrOwner
        nonReentrant
        returns (bytes[] memory results)
    {
        require(
            targets.length == values.length && values.length == datas.length,
            "AvaAgentWallet: array length mismatch"
        );

        uint256 totalValue = 0;
        for (uint256 i = 0; i < values.length; i++) {
            totalValue += values[i];
            if (whitelistEnabled) {
                require(
                    whitelistedTargets[targets[i]],
                    "AvaAgentWallet: target not whitelisted"
                );
            }
        }

        _checkAndResetSpending();
        require(
            currentSpent + totalValue <= spendingLimit,
            "AvaAgentWallet: spending limit exceeded"
        );
        currentSpent += totalValue;

        results = new bytes[](targets.length);

        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, bytes memory returnData) = targets[i].call{
                value: values[i]
            }(datas[i]);

            emit TransactionExecuted(targets[i], values[i], datas[i], success);

            require(success, "AvaAgentWallet: batch execution failed");
            results[i] = returnData;
        }

        return results;
    }

    /**
     * @notice Check if an address is an operator
     * @param account Address to check
     * @return True if operator
     */
    function isOperator(address account) external view override returns (bool) {
        return _operators[account];
    }

    // ============================================================================
    // Owner Functions
    // ============================================================================

    /**
     * @notice Add an operator
     * @param operator Address to add
     */
    function addOperator(address operator) external onlyOwner {
        require(operator != address(0), "AvaAgentWallet: zero address");
        require(!_operators[operator], "AvaAgentWallet: already operator");
        require(operatorCount < MAX_OPERATORS, "AvaAgentWallet: max operators");

        _operators[operator] = true;
        operatorCount++;

        emit OperatorAdded(operator);
    }

    /**
     * @notice Remove an operator
     * @param operator Address to remove
     */
    function removeOperator(address operator) external onlyOwner {
        require(_operators[operator], "AvaAgentWallet: not operator");

        _operators[operator] = false;
        operatorCount--;

        emit OperatorRemoved(operator);
    }

    /**
     * @notice Update spending limit
     * @param newLimit New limit in wei
     */
    function setSpendingLimit(uint256 newLimit) external onlyOwner {
        uint256 oldLimit = spendingLimit;
        spendingLimit = newLimit;

        emit SpendingLimitUpdated(oldLimit, newLimit);
    }

    /**
     * @notice Add target to whitelist
     * @param target Address to whitelist
     */
    function addToWhitelist(address target) external onlyOwner {
        whitelistedTargets[target] = true;
    }

    /**
     * @notice Remove target from whitelist
     * @param target Address to remove
     */
    function removeFromWhitelist(address target) external onlyOwner {
        whitelistedTargets[target] = false;
    }

    /**
     * @notice Toggle whitelist enforcement
     * @param enabled Whether to enable whitelist
     */
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
    }

    /**
     * @notice Withdraw native token
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "AvaAgentWallet: zero address");
        (bool success, ) = to.call{value: amount}("");
        require(success, "AvaAgentWallet: transfer failed");
    }

    /**
     * @notice Withdraw ERC20 token
     * @param token Token address
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "AvaAgentWallet: zero address");
        IERC20(token).safeTransfer(to, amount);
    }

    // ============================================================================
    // Internal Functions
    // ============================================================================

    /**
     * @notice Check and reset spending if period elapsed
     */
    function _checkAndResetSpending() internal {
        if (block.timestamp >= lastResetTime + RESET_PERIOD) {
            currentSpent = 0;
            lastResetTime = block.timestamp;
        }
    }

    // ============================================================================
    // Receive Function
    // ============================================================================

    receive() external payable {}
}
