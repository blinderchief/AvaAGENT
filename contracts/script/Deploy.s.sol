// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/wallet/AvaAgentWallet.sol";
import "../src/wallet/AvaAgentWalletFactory.sol";
import "../src/registry/AgentRegistry.sol";
import "../src/payments/X402PaymentFacilitator.sol";
import "../src/intents/IntentProcessor.sol";

/**
 * @title DeployAvaAgent
 * @notice Deployment script for AvaAgent contracts
 */
contract DeployAvaAgent is Script {
    // Deployment addresses
    address public walletFactory;
    address public agentRegistry;
    address public paymentFacilitator;
    address public intentProcessor;

    // Configuration
    uint256 public constant DEFAULT_SPENDING_LIMIT = 10 ether;
    uint256 public constant PLATFORM_FEE_BPS = 100; // 1%

    function run() external {
        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying AvaAgent contracts...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Wallet Factory
        AvaAgentWalletFactory factory = new AvaAgentWalletFactory(
            DEFAULT_SPENDING_LIMIT
        );
        walletFactory = address(factory);
        console.log("WalletFactory deployed at:", walletFactory);

        // 2. Deploy Agent Registry
        AgentRegistry registry = new AgentRegistry();
        agentRegistry = address(registry);
        console.log("AgentRegistry deployed at:", agentRegistry);

        // 3. Deploy Payment Facilitator
        X402PaymentFacilitator facilitator = new X402PaymentFacilitator(
            PLATFORM_FEE_BPS,
            deployer // Fee recipient
        );
        paymentFacilitator = address(facilitator);
        console.log("PaymentFacilitator deployed at:", paymentFacilitator);

        // 4. Deploy Intent Processor
        IntentProcessor processor = new IntentProcessor();
        intentProcessor = address(processor);
        console.log("IntentProcessor deployed at:", intentProcessor);

        // 5. Setup permissions
        // Add intent processor as executor
        processor.addExecutor(deployer);
        processor.addVerifier(deployer);

        vm.stopBroadcast();

        // Log summary
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("Wallet Factory:", walletFactory);
        console.log("Agent Registry:", agentRegistry);
        console.log("Payment Facilitator:", paymentFacilitator);
        console.log("Intent Processor:", intentProcessor);
    }
}
