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

import cre from "@aspect-build/aspect-workflows-cre-sdk";
import { Runtime, HTTPClient } from "@aspect-build/aspect-workflows-cre-sdk";

/**
 * Configuration type - matches config/config.json
 */
interface Config {
  apiUrl: string;
  maxRetries: number;
}

/**
 * Expected request body structure
 */
interface RequestBody {
  action: string;
  data: Record<string, unknown>;
}

/**
 * Response structure
 */
interface ApiResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export default cre.handler(
  async function (runtime: Runtime<Config>): Promise<void> {
    const { trigger, config } = runtime;

    // Validate trigger type
    if (trigger.type !== "http") {
      throw new Error("This workflow only handles HTTP triggers");
    }

    const { method, path, headers, body } = trigger.http;
    console.log(`Received ${method} request to ${path}`);

    // Parse and validate request body
    const requestBody = body as RequestBody;
    if (!requestBody?.action) {
      runtime.emit({
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Missing required field: action",
        } as ApiResponse),
      });
      return;
    }

    try {
      // Get HTTP client capability
      const httpClient = runtime.getCapability<HTTPClient>("http-client");

      // Get API key from secrets (if needed)
      const apiKey = await runtime.getSecret("API_KEY");

      // Make API call
      const response = await httpClient.fetch<ApiResponse>(
        `${config.apiUrl}/process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            action: requestBody.action,
            data: requestBody.data,
          }),
          timeout: 30000,
        }
      );

      // Return success response
      runtime.emit({
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          result: response,
        } as ApiResponse),
      });
    } catch (error) {
      console.error("Workflow failed:", error);

      runtime.emit({
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        } as ApiResponse),
      });
    }
  }
);
