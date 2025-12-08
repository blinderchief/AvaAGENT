// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IAvaAgentWallet
 * @notice Interface for AvaAgent smart contract wallet
 */
interface IAvaAgentWallet {
    /// @notice Emitted when a transaction is executed
    event TransactionExecuted(
        address indexed to,
        uint256 value,
        bytes data,
        bool success
    );

    /// @notice Emitted when spending limit is updated
    event SpendingLimitUpdated(uint256 oldLimit, uint256 newLimit);

    /// @notice Emitted when an operator is added
    event OperatorAdded(address indexed operator);

    /// @notice Emitted when an operator is removed
    event OperatorRemoved(address indexed operator);

    /// @notice Execute a transaction
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory);

    /// @notice Execute a batch of transactions
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external returns (bytes[] memory);

    /// @notice Check if an address is an operator
    function isOperator(address account) external view returns (bool);

    /// @notice Get the current spending limit
    function spendingLimit() external view returns (uint256);

    /// @notice Get the amount spent in current period
    function currentSpent() external view returns (uint256);
}
