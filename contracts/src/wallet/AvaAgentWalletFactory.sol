// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AvaAgentWallet.sol";

/**
 * @title AvaAgentWalletFactory
 * @notice Factory contract for deploying AvaAgent wallets
 */
contract AvaAgentWalletFactory is Ownable, Pausable {
    // ============================================================================
    // Events
    // ============================================================================

    event WalletCreated(
        address indexed wallet,
        address indexed owner,
        uint256 spendingLimit
    );

    event DefaultLimitUpdated(uint256 oldLimit, uint256 newLimit);

    // ============================================================================
    // State Variables
    // ============================================================================

    /// @notice Mapping of owner to their wallets
    mapping(address => address[]) public userWallets;

    /// @notice All deployed wallets
    address[] public allWallets;

    /// @notice Default spending limit for new wallets
    uint256 public defaultSpendingLimit;

    /// @notice Minimum spending limit
    uint256 public constant MIN_SPENDING_LIMIT = 0.01 ether;

    // ============================================================================
    // Constructor
    // ============================================================================

    constructor(uint256 _defaultSpendingLimit) Ownable(msg.sender) {
        require(
            _defaultSpendingLimit >= MIN_SPENDING_LIMIT,
            "Factory: limit too low"
        );
        defaultSpendingLimit = _defaultSpendingLimit;
    }

    // ============================================================================
    // External Functions
    // ============================================================================

    /**
     * @notice Create a new agent wallet with default settings
     * @return wallet The deployed wallet address
     */
    function createWallet() external whenNotPaused returns (address wallet) {
        return createWalletWithLimit(defaultSpendingLimit);
    }

    /**
     * @notice Create a new agent wallet with custom spending limit
     * @param _spendingLimit Custom spending limit
     * @return wallet The deployed wallet address
     */
    function createWalletWithLimit(
        uint256 _spendingLimit
    ) public whenNotPaused returns (address wallet) {
        require(
            _spendingLimit >= MIN_SPENDING_LIMIT,
            "Factory: limit too low"
        );

        // Deploy new wallet
        AvaAgentWallet newWallet = new AvaAgentWallet(
            msg.sender,
            _spendingLimit
        );

        wallet = address(newWallet);

        // Store wallet reference
        userWallets[msg.sender].push(wallet);
        allWallets.push(wallet);

        emit WalletCreated(wallet, msg.sender, _spendingLimit);

        return wallet;
    }

    /**
     * @notice Get all wallets for a user
     * @param user User address
     * @return wallets Array of wallet addresses
     */
    function getWalletsForUser(
        address user
    ) external view returns (address[] memory) {
        return userWallets[user];
    }

    /**
     * @notice Get wallet count for a user
     * @param user User address
     * @return count Number of wallets
     */
    function getWalletCount(address user) external view returns (uint256) {
        return userWallets[user].length;
    }

    /**
     * @notice Get total wallets deployed
     * @return Total count
     */
    function totalWallets() external view returns (uint256) {
        return allWallets.length;
    }

    // ============================================================================
    // Owner Functions
    // ============================================================================

    /**
     * @notice Update default spending limit
     * @param newLimit New default limit
     */
    function setDefaultSpendingLimit(uint256 newLimit) external onlyOwner {
        require(newLimit >= MIN_SPENDING_LIMIT, "Factory: limit too low");
        
        uint256 oldLimit = defaultSpendingLimit;
        defaultSpendingLimit = newLimit;

        emit DefaultLimitUpdated(oldLimit, newLimit);
    }

    /**
     * @notice Pause factory
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause factory
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
