---
name: cre-typescript
description: Build Chainlink Runtime Environment (CRE) workflows in TypeScript - triggers, SDK, CLI, secrets, limits
---

# CRE TypeScript Skill

You are an expert in Chainlink Runtime Environment (CRE) for building decentralized workflows in TypeScript.

## Quick Commands

```bash
# Initialize a new CRE project
cre init

# Check CRE CLI installation
./scripts/check-cre-cli.sh

# Validate workflow structure
./scripts/validate-workflow.sh <workflow-path>

# Simulate workflow locally
./scripts/simulate-workflow.sh <workflow-path>

# Analyze for limit violations
./scripts/analyze-limits.sh <workflow-path>

# Get list of chain selectors (names and IDs)
./scripts/get-chain-selector.sh

# Fetch full official docs (when unsure about details)
./scripts/fetch-docs.sh
```

## Core Concepts

| Concept        | Description                                           |
| -------------- | ----------------------------------------------------- |
| **Workflow**   | A TypeScript function that runs in CRE's WASM sandbox |
| **Trigger**    | What starts the workflow: HTTP, Cron, or EVM Log      |
| **Capability** | External actions: HTTPClient, EVMClient               |
| **Handler**    | The main entry point using `cre.handler()`            |
| **Secrets**    | Secure credentials accessed via `runtime.getSecret()` |

## Basic Workflow Structure

```typescript
import {
  cre,
  type Runtime,
  Runner,
  getNetwork,
  bytesToHex,
  EVMLog,
} from "@chainlink/cre-sdk";
import { keccak256, toHex, decodeEventLog, parseAbi } from "viem";
import { configSchema, type Config } from "./types";

/** ABI for the event to listen for */
const eventAbi = parseAbi(["event MyEvent(uint256 indexed id, string data)"]);
const eventSignature = "MyEvent(uint256,string)";

/*********************************
 * Trigger Handler
 *********************************/
const onTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
  try {
    // Decode event log
    const topics = log.topics.map((t) => bytesToHex(t)) as [
      `0x${string}`,
      ...`0x${string}`[],
    ];
    const data = bytesToHex(log.data);
    const decodedLog = decodeEventLog({ abi: eventAbi, data, topics });

    runtime.log(`Event: ${decodedLog.eventName}`);

    // Implement business logic here
    // - Query external APIs
    // - Write to blockchain
    // - Store data

    return "Success";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`Error: ${msg}`);
    throw err;
  }
};

/*********************************
 * Workflow Initialization
 *********************************/
const initWorkflow = (config: Config) => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainSelectorName,
    isTestnet: true,
  });

  if (!network) throw new Error("Network not found");

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector,
  );
  const eventTopicHash = keccak256(toHex(eventSignature));

  return [
    cre.handler(
      evmClient.logTrigger({
        addresses: [config.contractAddress],
        topics: [{ values: [eventTopicHash] }],
        confidence: "CONFIDENCE_LEVEL_FINALIZED",
      }),
      onTrigger,
    ),
  ];
};

/*********************************
 * Entry Point
 *********************************/
export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();
```

## Critical Limits

| Resource             | Limit      |
| -------------------- | ---------- |
| Execution timeout    | 5 minutes  |
| Memory               | 100 MB     |
| HTTP calls/execution | 5          |
| EVM reads/execution  | 10         |
| Response size        | 100 KB     |
| Cron min interval    | 30 seconds |

## Workflow Templates

| Template                           | Use Case                              |
| ---------------------------------- | ------------------------------------- |
| `templates/workflow-http.ts`       | HTTP webhook handlers                 |
| `templates/workflow-cron.ts`       | Scheduled jobs (min 30s)              |
| `templates/workflow-evm-log.ts`    | Smart contract event listeners        |
| `templates/workflow.yaml.template` | Workflow metadata                     |
| `templates/config.json.template`   | Target configuration                  |
| `templates/project.yaml.template`  | Project-level CLI targets (RPCs, DON) |
| `templates/secrets.yaml.template`  | Secrets declaration                   |
| `templates/.env.template`          | Environment variables for simulation  |

## Secrets Management

Secrets (API keys, credentials) are declared in `secrets.yaml` and accessed via `runtime.getSecret()`.

### Step 1: Define Secrets in secrets.yaml

```yaml
secretsNames:
  MY_API_KEY: # Name used in code: runtime.getSecret("MY_API_KEY")
    - MY_API_KEY_VAR # Environment variable name in .env file
  DATABASE_URL:
    - DATABASE_URL_VAR
```

### Step 2: Create .env File for Simulation

```bash
# .env (add to .gitignore!)
MY_API_KEY_VAR=your_actual_api_key_here
DATABASE_URL_VAR=postgres://user:pass@localhost:5432/db
```

### Step 3: Access Secrets in Workflow Code

```typescript
const onTrigger = (runtime: Runtime<Config>, trigger: CronTrigger): string => {
  // Get secret value using the name from secrets.yaml
  const apiKey = runtime.getSecret("MY_API_KEY");
  const dbUrl = runtime.getSecret("DATABASE_URL");

  if (!apiKey) {
    throw new Error("MY_API_KEY secret not found");
  }

  // Use the secret in your API calls
  const httpClient = new cre.capabilities.HTTPClient();
  const response = httpClient.fetch({
    url: "https://api.example.com/data",
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return "Success";
};
```

### Secrets Limits

| Resource                        | Limit |
| ------------------------------- | ----- |
| Total secrets size per workflow | 1 MB  |
| Concurrent secret fetches       | 5     |
| Secrets per account             | 100   |

**Docs**: https://docs.chain.link/cre/guides/workflow/secrets/using-secrets-simulation-ts

## Getting Detailed Documentation

**When you need more details** (CLI options, SDK types, trigger configs, capability methods, etc.), run:

```bash
./scripts/fetch-docs.sh
```

This downloads the full official docs to `/tmp/cre-docs-full.txt`. Then read that file for accurate, up-to-date information.

Use fetch-docs.sh when:

- Unsure about specific API details or method signatures
- Need exact CLI command options
- User asks about advanced features
- Troubleshooting unusual errors
- Anything not covered in this quick reference

Source: https://docs.chain.link/cre/llms-full-ts.txt
