// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title X402PaymentFacilitator
 * @notice Facilitator contract for x402 HTTP payment protocol
 * @dev Handles payment verification and settlement for micropayments
 */
contract X402PaymentFacilitator is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============================================================================
    // Types
    // ============================================================================

    struct Payment {
        address payer;
        address payee;
        uint256 amount;
        address token; // address(0) for native token
        bytes32 resourceHash;
        uint256 nonce;
        uint256 expiry;
        bool settled;
    }

    struct PaymentSignature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // ============================================================================
    // Events
    // ============================================================================

    event PaymentSettled(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        address token
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 amount
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);

    event TokenWhitelisted(address indexed token, bool whitelisted);

    // ============================================================================
    // State Variables
    // ============================================================================

    /// @notice Domain separator for EIP-712
    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @notice Payment typehash for EIP-712
    bytes32 public constant PAYMENT_TYPEHASH = keccak256(
        "Payment(address payer,address payee,uint256 amount,address token,bytes32 resourceHash,uint256 nonce,uint256 expiry)"
    );

    /// @notice Platform fee in basis points (1% = 100)
    uint256 public platformFeeBps;

    /// @notice Maximum fee (10%)
    uint256 public constant MAX_FEE_BPS = 1000;

    /// @notice Fee recipient address
    address public feeRecipient;

    /// @notice Payment ID to payment mapping
    mapping(bytes32 => Payment) public payments;

    /// @notice User nonces for replay protection
    mapping(address => uint256) public nonces;

    /// @notice Whitelisted payment tokens
    mapping(address => bool) public whitelistedTokens;

    /// @notice Total volume processed
    uint256 public totalVolume;

    /// @notice Total fees collected
    uint256 public totalFeesCollected;

    // ============================================================================
    // Constructor
    // ============================================================================

    constructor(
        uint256 _platformFeeBps,
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_platformFeeBps <= MAX_FEE_BPS, "X402: fee too high");
        require(_feeRecipient != address(0), "X402: zero address");

        platformFeeBps = _platformFeeBps;
        feeRecipient = _feeRecipient;

        // Native token always whitelisted
        whitelistedTokens[address(0)] = true;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("X402PaymentFacilitator")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    // ============================================================================
    // External Functions
    // ============================================================================

    /**
     * @notice Verify a payment authorization
     * @param payer Payer address
     * @param payee Payee address
     * @param amount Payment amount
     * @param token Token address (address(0) for native)
     * @param resourceHash Hash of the resource being paid for
     * @param nonce Payment nonce
     * @param expiry Expiry timestamp
     * @param signature Payment signature
     * @return valid Whether the payment is valid
     * @return paymentId The payment ID
     */
    function verifyPayment(
        address payer,
        address payee,
        uint256 amount,
        address token,
        bytes32 resourceHash,
        uint256 nonce,
        uint256 expiry,
        bytes calldata signature
    ) external view returns (bool valid, bytes32 paymentId) {
        // Generate payment ID
        paymentId = _getPaymentId(
            payer,
            payee,
            amount,
            token,
            resourceHash,
            nonce
        );

        // Check if already settled
        if (payments[paymentId].settled) {
            return (false, paymentId);
        }

        // Check expiry
        if (block.timestamp > expiry) {
            return (false, paymentId);
        }

        // Check nonce
        if (nonce != nonces[payer]) {
            return (false, paymentId);
        }

        // Check token whitelist
        if (!whitelistedTokens[token]) {
            return (false, paymentId);
        }

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                PAYMENT_TYPEHASH,
                payer,
                payee,
                amount,
                token,
                resourceHash,
                nonce,
                expiry
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        address signer = _recoverSigner(digest, signature);
        valid = (signer == payer);

        return (valid, paymentId);
    }

    /**
     * @notice Settle a payment
     * @param payer Payer address
     * @param payee Payee address
     * @param amount Payment amount
     * @param token Token address (address(0) for native)
     * @param resourceHash Hash of the resource being paid for
     * @param nonce Payment nonce
     * @param expiry Expiry timestamp
     * @param signature Payment signature
     */
    function settlePayment(
        address payer,
        address payee,
        uint256 amount,
        address token,
        bytes32 resourceHash,
        uint256 nonce,
        uint256 expiry,
        bytes calldata signature
    ) external payable nonReentrant {
        // Verify payment
        (bool valid, bytes32 paymentId) = this.verifyPayment(
            payer,
            payee,
            amount,
            token,
            resourceHash,
            nonce,
            expiry,
            signature
        );

        require(valid, "X402: invalid payment");

        // Mark as settled
        payments[paymentId] = Payment({
            payer: payer,
            payee: payee,
            amount: amount,
            token: token,
            resourceHash: resourceHash,
            nonce: nonce,
            expiry: expiry,
            settled: true
        });

        // Increment nonce
        nonces[payer]++;

        // Calculate fee
        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 payeeAmount = amount - fee;

        // Transfer payment
        if (token == address(0)) {
            // Native token - must be sent with transaction
            require(msg.value >= amount, "X402: insufficient payment");

            // Pay payee
            (bool success, ) = payee.call{value: payeeAmount}("");
            require(success, "X402: transfer failed");

            // Pay fee
            if (fee > 0) {
                (success, ) = feeRecipient.call{value: fee}("");
                require(success, "X402: fee transfer failed");
            }

            // Refund excess
            if (msg.value > amount) {
                (success, ) = msg.sender.call{value: msg.value - amount}("");
                require(success, "X402: refund failed");
            }
        } else {
            // ERC20 token
            IERC20(token).safeTransferFrom(payer, payee, payeeAmount);
            if (fee > 0) {
                IERC20(token).safeTransferFrom(payer, feeRecipient, fee);
            }
        }

        // Update stats
        totalVolume += amount;
        totalFeesCollected += fee;

        emit PaymentSettled(paymentId, payer, payee, amount, token);
    }

    /**
     * @notice Get payment by ID
     * @param paymentId Payment identifier
     * @return Payment struct
     */
    function getPayment(
        bytes32 paymentId
    ) external view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @notice Get current nonce for user
     * @param user User address
     * @return Current nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    // ============================================================================
    // Owner Functions
    // ============================================================================

    /**
     * @notice Update platform fee
     * @param newFeeBps New fee in basis points
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "X402: fee too high");

        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;

        emit FeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Update fee recipient
     * @param newRecipient New recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "X402: zero address");
        feeRecipient = newRecipient;
    }

    /**
     * @notice Whitelist a payment token
     * @param token Token address
     * @param whitelisted Whether to whitelist
     */
    function setTokenWhitelist(
        address token,
        bool whitelisted
    ) external onlyOwner {
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    // ============================================================================
    // Internal Functions
    // ============================================================================

    /**
     * @notice Generate payment ID
     */
    function _getPaymentId(
        address payer,
        address payee,
        uint256 amount,
        address token,
        bytes32 resourceHash,
        uint256 nonce
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                payer,
                payee,
                amount,
                token,
                resourceHash,
                nonce
            )
        );
    }

    /**
     * @notice Recover signer from signature
     */
    function _recoverSigner(
        bytes32 digest,
        bytes memory signature
    ) internal pure returns (address) {
        require(signature.length == 65, "X402: invalid signature");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        return ecrecover(digest, v, r, s);
    }

    // ============================================================================
    // Receive Function
    // ============================================================================

    receive() external payable {}
}
