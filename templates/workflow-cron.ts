/**
 * CRE Cron Trigger Workflow Template
 *
 * This workflow runs on a schedule.
 * Use for: Periodic tasks, data sync, monitoring, reports
 *
 * Limits:
 * - Minimum interval: 30 seconds
 * - 5 minute execution timeout
 * - 5 HTTP calls per execution
 */

import cre from "@aspect-build/aspect-workflows-cre-sdk";
import { Runtime, HTTPClient, EVMClient } from "@aspect-build/aspect-workflows-cre-sdk";

/**
 * Configuration type - matches config/config.json
 */
interface Config {
  apiEndpoint: string;
  chainId: number;
  contractAddress: string;
  alertThreshold: number;
}

/**
 * Data structure for monitoring
 */
interface MetricData {
  timestamp: string;
  value: number;
  source: string;
}

export default cre.handler(
  async function (runtime: Runtime<Config>): Promise<void> {
    const { trigger, config } = runtime;

    // Validate trigger type
    if (trigger.type !== "cron") {
      throw new Error("This workflow only handles cron triggers");
    }

    const { scheduledTime, actualTime } = trigger.cron;
    console.log(`Cron triggered - Scheduled: ${scheduledTime}, Actual: ${actualTime}`);

    // Get capabilities
    const httpClient = runtime.getCapability<HTTPClient>("http-client");
    const evmClient = runtime.getCapability<EVMClient>("evm-client");

    try {
      // Step 1: Fetch external data
      console.log("Fetching external metrics...");
      const apiKey = await runtime.getSecret("METRICS_API_KEY");

      const externalMetrics = await httpClient.fetch<MetricData>(
        `${config.apiEndpoint}/metrics/latest`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      // Step 2: Read on-chain data
      console.log("Reading on-chain data...");
      const onChainValue = await evmClient.readContract<bigint>({
        chainId: config.chainId,
        address: config.contractAddress,
        abi: [
          {
            name: "getValue",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "getValue",
      });

      // Step 3: Process and compare
      const onChainNumber = Number(onChainValue);
      const externalValue = externalMetrics.value;
      const difference = Math.abs(onChainNumber - externalValue);

      console.log(`On-chain: ${onChainNumber}, External: ${externalValue}, Diff: ${difference}`);

      // Step 4: Alert if threshold exceeded
      if (difference > config.alertThreshold) {
        console.warn(`Alert: Difference ${difference} exceeds threshold ${config.alertThreshold}`);

        // Send alert notification
        const webhookUrl = await runtime.getSecret("ALERT_WEBHOOK_URL");
        await httpClient.fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alert: "Value discrepancy detected",
            onChainValue: onChainNumber,
            externalValue: externalValue,
            difference: difference,
            threshold: config.alertThreshold,
            timestamp: actualTime,
          }),
        });

        console.log("Alert sent successfully");
      } else {
        console.log("Values within acceptable range");
      }

      // Step 5: Log completion (optional: store results)
      await httpClient.fetch(`${config.apiEndpoint}/metrics/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          timestamp: actualTime,
          onChainValue: onChainNumber,
          externalValue: externalValue,
          status: difference > config.alertThreshold ? "alert" : "ok",
        }),
      });

      console.log("Cron job completed successfully");
    } catch (error) {
      console.error("Cron job failed:", error);
      throw error; // Re-throw to mark execution as failed
    }
  }
);
