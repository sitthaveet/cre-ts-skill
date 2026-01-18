// Example of using GET HTTP request to fetch data from external API

import {
  cre,
  ok,
  type Runtime,
  type HTTPSendRequester,
  Runner,
} from "@chainlink/cre-sdk";
import { z } from "zod";

// Config schema
const configSchema = z.object({
  schedule: z.string(),
  apiUrl: z.string(),
});

type Config = z.infer<typeof configSchema>;

// Types
type PriceData = {
  price: number;
  lastUpdated: Date;
};

type ExternalApiResponse = {
  ethereum: {
    usd: number;
    last_updated_at: number;
  };
};

// Fetch function receives sendRequester and config as parameters
const fetchAndParse = (
  sendRequester: HTTPSendRequester,
  config: Config,
): PriceData => {
  const req = {
    url: config.apiUrl,
    method: "GET" as const,
  };

  const resp = sendRequester.sendRequest(req).result();

  if (!ok(resp)) {
    throw new Error(`API returned status ${resp.statusCode}`);
  }

  const bodyText = new TextDecoder().decode(resp.body);
  const externalResp = JSON.parse(bodyText) as ExternalApiResponse;

  return {
    price: externalResp.ethereum.usd,
    lastUpdated: new Date(externalResp.ethereum.last_updated_at * 1000),
  };
};

// Main workflow handler
const onCronTrigger = (runtime: Runtime<Config>): string => {
  const httpClient = new cre.capabilities.HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      fetchAndParse,
      new cre.consensus.ConsensusAggregationByFields<PriceData>({
        price: cre.consensus.median<number>(),
        lastUpdated: cre.consensus.median<Date>(),
      }),
    )(runtime.config) // Call with config
    .result();

  runtime.log(
    `Successfully fetched price: $${result.price} at ${result.lastUpdated.toISOString()}`,
  );

  return `Price: ${result.price}`;
};

// Initialize workflow
const initWorkflow = (config: Config) => {
  return [
    cre.handler(
      new cre.capabilities.CronCapability().trigger({
        schedule: config.schedule,
      }),
      onCronTrigger,
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();
