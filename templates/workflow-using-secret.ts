// Example of using multiple secrets in CRE workflow

// Your secrets.yaml
// secretsNames:
//   SECRET_ADDRESS:
//     - SECRET_ADDRESS_ALL
//   API_KEY:
//     - API_KEY_ALL

// in .env file you should have values of "SECRET_ADDRESS_ALL" and "API_KEY_ALL"

import {
  CronCapability,
  handler,
  Runner,
  type Runtime,
} from "@chainlink/cre-sdk";

// Config can be an empty object if you don't need any parameters from config.json
type Config = Record<string, never>;

// Define the logical name of the secret as a constant for clarity
const SECRET_NAME = "SECRET_ADDRESS";

// onCronTrigger is the callback function that gets executed when the cron trigger fires
// This is where you use the secret
const onCronTrigger = (runtime: Runtime<Config>): string => {
  // Call runtime.getSecret with the secret's logical ID
  const secret = runtime.getSecret({ id: SECRET_NAME }).result();

  // Use the secret's value
  const secretAddress = secret.value;
  runtime.log(`Successfully fetched a secret! Address: ${secretAddress}`);

  // ... now you can use the secretAddress in your logic ...
  return "Success";
};

// initWorkflow is the entry point for the workflow
const initWorkflow = () => {
  const cron = new CronCapability();

  return [handler(cron.trigger({ schedule: "0 */10 * * * *" }), onCronTrigger)];
};

// main is the entry point for the WASM binary
export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
