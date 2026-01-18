/**
 * CRE EVM Log Trigger Workflow Template
 *
 * This workflow reacts to smart contract events.
 * Use for: Event-driven automation, cross-chain bridges, notifications
 *
 * Limits:
 * - 10 EVM read operations per execution
 * - 5 EVM write operations per execution
 * - 5 HTTP calls per execution
 */

import cre from "@aspect-build/aspect-workflows-cre-sdk";
import { Runtime, HTTPClient, EVMClient } from "@aspect-build/aspect-workflows-cre-sdk";

/**
 * Configuration type - matches config/config.json
 */
interface Config {
  sourceChainId: number;
  targetChainId: number;
  targetContractAddress: string;
  notificationWebhook: string;
}

/**
 * ERC20 Transfer event structure
 */
interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
}

/**
 * ABI for the target contract
 */
const targetContractABI = [
  {
    name: "processTransfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sourceChain", type: "uint256" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "txHash", type: "bytes32" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    name: "isProcessed",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "txHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
];

/**
 * Decode Transfer event from log data
 */
function decodeTransferEvent(topics: string[], data: string): TransferEvent {
  // Transfer(address indexed from, address indexed to, uint256 value)
  // topics[0] = event signature
  // topics[1] = from (indexed)
  // topics[2] = to (indexed)
  // data = value (non-indexed)

  const from = "0x" + topics[1].slice(26); // Remove padding
  const to = "0x" + topics[2].slice(26);
  const value = BigInt(data);

  return { from, to, value };
}

export default cre.handler(
  async function (runtime: Runtime<Config>): Promise<void> {
    const { trigger, config } = runtime;

    // Validate trigger type
    if (trigger.type !== "evm-log") {
      throw new Error("This workflow only handles EVM log triggers");
    }

    const {
      chainId,
      address,
      topics,
      data,
      blockNumber,
      transactionHash,
      logIndex,
    } = trigger.evmLog;

    console.log(`Processing event from block ${blockNumber}, tx: ${transactionHash}`);

    // Get capabilities
    const httpClient = runtime.getCapability<HTTPClient>("http-client");
    const evmClient = runtime.getCapability<EVMClient>("evm-client");

    try {
      // Step 1: Decode the event
      const transfer = decodeTransferEvent(topics, data);
      console.log(`Transfer: ${transfer.from} -> ${transfer.to}, Amount: ${transfer.value}`);

      // Step 2: Check if already processed (idempotency)
      const txHashBytes = transactionHash as `0x${string}`;
      const isProcessed = await evmClient.readContract<boolean>({
        chainId: config.targetChainId,
        address: config.targetContractAddress,
        abi: targetContractABI,
        functionName: "isProcessed",
        args: [txHashBytes],
      });

      if (isProcessed) {
        console.log("Transaction already processed, skipping");
        return;
      }

      // Step 3: Validate the transfer (optional business logic)
      const minAmount = BigInt("1000000000000000000"); // 1 token
      if (transfer.value < minAmount) {
        console.log(`Amount ${transfer.value} below minimum, skipping`);
        return;
      }

      // Step 4: Execute cross-chain action
      console.log("Executing cross-chain transfer processing...");

      const txResult = await evmClient.writeContract({
        chainId: config.targetChainId,
        address: config.targetContractAddress,
        abi: targetContractABI,
        functionName: "processTransfer",
        args: [
          BigInt(config.sourceChainId),
          transfer.from,
          transfer.to,
          transfer.value,
          txHashBytes,
        ],
      });

      console.log(`Cross-chain transaction submitted: ${txResult}`);

      // Step 5: Send notification
      if (config.notificationWebhook) {
        await httpClient.fetch(config.notificationWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "transfer_processed",
            sourceChain: config.sourceChainId,
            targetChain: config.targetChainId,
            sourceTx: transactionHash,
            targetTx: txResult,
            from: transfer.from,
            to: transfer.to,
            amount: transfer.value.toString(),
            blockNumber: blockNumber,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log("Notification sent");
      }

      console.log("EVM log workflow completed successfully");
    } catch (error) {
      console.error("EVM log workflow failed:", error);

      // Send error notification
      try {
        await httpClient.fetch(config.notificationWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "transfer_failed",
            error: error instanceof Error ? error.message : "Unknown error",
            sourceTx: transactionHash,
            blockNumber: blockNumber,
          }),
        });
      } catch {
        console.error("Failed to send error notification");
      }

      throw error;
    }
  }
);
