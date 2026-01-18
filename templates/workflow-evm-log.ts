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

import { cre, type Runtime, Runner, getNetwork, bytesToHex, EVMLog } from "@chainlink/cre-sdk";
import { keccak256, toHex, decodeEventLog, parseAbi } from "viem";
import { configSchema, type Config } from "./types";

/** ABI for the event CRE listens for. */
const eventAbi = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
const eventSignature = "Transfer(address,address,uint256)";

/*********************************
 * Log Trigger Handler
 *********************************/

/**
 * Handles Transfer events from the monitored contract.
 * Implement your business logic here.
 *
 * @param runtime - CRE runtime instance with config and secrets
 * @param log - EVM log containing the event
 * @returns Success message string
 */
const onLogTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
  try {
    // ========================================
    // Step 1: Decode Event Log
    // ========================================

    // Convert topics/data to hex for viem decoding
    const topics = log.topics.map(t => bytesToHex(t)) as [`0x${string}`, ...`0x${string}`[]];
    const data = bytesToHex(log.data);

    // Decode event fields using the ABI above
    const decodedLog = decodeEventLog({ abi: eventAbi, data, topics });
    runtime.log(`Event name: ${decodedLog.eventName}`);

    const from = decodedLog.args.from as string;
    const to = decodedLog.args.to as string;
    const value = decodedLog.args.value as bigint;

    runtime.log(`Transfer detected: ${from} -> ${to}, Amount: ${value.toString()}`);

    // ========================================
    // Step 2: Implement Your Business Logic
    // ========================================
    // Examples:
    // - Query external API with httpClient
    // - Write to another contract with evmClient
    // - Store data in Firestore/database
    // - Send notifications

    // const result = callExternalApi(runtime, from, to, value);
    // const txHash = executeOnChainAction(runtime, result);
    // writeToDatabase(runtime, txHash);

    return "Event Processed Successfully";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`onLogTrigger error: ${msg}`);
    throw err;
  }
};

/*********************************
 * Workflow Initialization
 *********************************/

/**
 * Initializes the CRE workflow by setting up the EVM log trigger.
 * Configures the workflow to listen for events from the specified contract.
 *
 * @param config - Validated workflow configuration
 * @returns Array of CRE handlers
 */
const initWorkflow = (config: Config) => {
  // Fetch the chain network to listen for logs on
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Network not found for chain selector name: ${config.chainSelectorName}`);
  }

  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

  // Compute the event topic hash for the event that we wish to monitor
  const eventTopicHash = keccak256(toHex(eventSignature));

  // Trigger CRE only on emit of specified logs from the contract
  return [
    cre.handler(
      evmClient.logTrigger({
        addresses: [config.contractAddress],
        topics: [{ values: [eventTopicHash] }],
        confidence: "CONFIDENCE_LEVEL_FINALIZED",
      }),
      onLogTrigger
    ),
  ];
};

/*********************************
 * Entry Point
 *********************************/

/**
 * Main entry point for the CRE workflow.
 * Initializes the CRE runner and starts the workflow.
 */
export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();
