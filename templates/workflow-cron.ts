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

import { cre, type Runtime, Runner, type CronTrigger } from "@chainlink/cre-sdk";
import { configSchema, type Config } from "./types";

/*********************************
 * Cron Trigger Handler
 *********************************/

/**
 * Handles scheduled cron triggers.
 * Implement your business logic here.
 *
 * @param runtime - CRE runtime instance with config and secrets
 * @param trigger - Cron trigger containing scheduled and actual time
 * @returns Success message string
 */
const onCronTrigger = (runtime: Runtime<Config>, trigger: CronTrigger): string => {
  try {
    // ========================================
    // Step 1: Log Trigger Info
    // ========================================

    runtime.log(`Cron triggered - Scheduled: ${trigger.scheduledTime}, Actual: ${trigger.actualTime}`);

    // ========================================
    // Step 2: Implement Your Business Logic
    // ========================================
    // Examples:
    // - Fetch external data with httpClient
    // - Read on-chain data with evmClient
    // - Compare and process data
    // - Send alerts or notifications
    // - Update databases

    // const externalData = fetchExternalData(runtime);
    // const onChainData = readOnChainData(runtime);
    // const result = processData(externalData, onChainData);
    // sendNotification(runtime, result);

    // ========================================
    // Step 3: Return Result
    // ========================================

    return "Cron Job Completed Successfully";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`onCronTrigger error: ${msg}`);
    throw err;
  }
};

/*********************************
 * Workflow Initialization
 *********************************/

/**
 * Initializes the CRE workflow by setting up the cron trigger.
 *
 * @param config - Validated workflow configuration
 * @returns Array of CRE handlers
 */
const initWorkflow = (config: Config) => {
  // Set up cron trigger (minimum 30 second interval)
  return [
    cre.handler(
      cre.triggers.cron({
        schedule: config.cronSchedule || "0 */5 * * * *", // Every 5 minutes
        timezone: config.timezone || "UTC",
      }),
      onCronTrigger
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
