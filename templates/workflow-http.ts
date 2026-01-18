/**
 * CRE HTTP Trigger Workflow Template
 *
 * This workflow handles HTTP webhook requests.
 * Use for: APIs, webhook handlers, request-response patterns
 *
 * Limits:
 * - 5 HTTP calls per execution
 * - 100 KB response size
 * - 5 minute timeout
 */

import { cre, type Runtime, Runner, type HTTPRequest } from "@chainlink/cre-sdk";
import { configSchema, type Config } from "./types";

/*********************************
 * HTTP Trigger Handler
 *********************************/

/**
 * Handles incoming HTTP requests.
 * Implement your business logic here.
 *
 * @param runtime - CRE runtime instance with config and secrets
 * @param request - HTTP request containing method, path, headers, body
 * @returns Response string
 */
const onHttpTrigger = (runtime: Runtime<Config>, request: HTTPRequest): string => {
  try {
    // ========================================
    // Step 1: Parse Request
    // ========================================

    runtime.log(`Received ${request.method} request to ${request.path}`);

    // Parse request body if present
    const body = request.body ? JSON.parse(request.body) : {};
    runtime.log(`Request body: ${JSON.stringify(body)}`);

    // ========================================
    // Step 2: Implement Your Business Logic
    // ========================================
    // Examples:
    // - Validate request data
    // - Query external API with httpClient
    // - Read/write blockchain data with evmClient
    // - Process and transform data

    // const apiResult = callExternalApi(runtime, body);
    // const txHash = executeOnChainAction(runtime, apiResult);

    // ========================================
    // Step 3: Return Response
    // ========================================

    const response = {
      success: true,
      message: "Request processed successfully",
      data: body,
    };

    return JSON.stringify(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`onHttpTrigger error: ${msg}`);
    throw err;
  }
};

/*********************************
 * Workflow Initialization
 *********************************/

/**
 * Initializes the CRE workflow by setting up the HTTP trigger.
 *
 * @param config - Validated workflow configuration
 * @returns Array of CRE handlers
 */
const initWorkflow = (config: Config) => {
  // Set up HTTP trigger
  return [
    cre.handler(
      cre.triggers.http({
        path: config.webhookPath || "/webhook",
        methods: ["POST"],
      }),
      onHttpTrigger
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
