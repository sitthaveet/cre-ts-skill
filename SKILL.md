---
name: cre-typescript
description: Build Chainlink Runtime Environment (CRE) workflows in TypeScript - triggers, SDK, CLI, secrets, limits
---

# CRE TypeScript Skill

You are an expert in Chainlink Runtime Environment (CRE) for building decentralized workflows in TypeScript.

## Requirements

**Package Manager**: Bun

CRE workflows require Bun as the package manager. Before starting any project:

```bash
bun --version  # Must be >= 1.2.21
```

If Bun is not installed or version is too old:
```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash
```

## Quick Commands

```bash
# If user wants to start a new project, always use
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
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPSendRequester,
  Runner,
} from "@chainlink/cre-sdk"
import { z } from "zod"

// Config schema
const configSchema = z.object({
  webhookUrl: z.string(),
  schedule: z.string(),
})

type Config = z.infer<typeof configSchema>

// Data to be sent
type MyData = {
  message: string
  value: number
}

// Response for consensus
type PostResponse = {
  statusCode: number
}

const postData = (sendRequester: HTTPSendRequester, config: Config): PostResponse => {
  // 1. Prepare the data to be sent
  const dataToSend: MyData = {
    message: "Hello there!",
    value: 77,
  }

  // 2. Serialize the data to JSON and encode as bytes
  const bodyBytes = new TextEncoder().encode(JSON.stringify(dataToSend))

  // 3. Convert to base64 for the request
  const body = Buffer.from(bodyBytes).toString("base64")

  // 4. Construct the POST request with cacheSettings
  const req = {
    url: config.webhookUrl,
    method: "POST" as const,
    body,
    headers: {
      "Content-Type": "application/json",
    },
    cacheSettings: {
      readFromCache: true, // Enable reading from cache
      maxAgeMs: 60000, // Accept cached responses up to 60 seconds old
    },
  }

  // 5. Send the request and wait for the response
  const resp = sendRequester.sendRequest(req).result()

  if (!ok(resp)) {
    throw new Error(`HTTP request failed with status: ${resp.statusCode}`)
  }

  return { statusCode: resp.statusCode }
}

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const httpClient = new cre.capabilities.HTTPClient()

  const result = httpClient
    .sendRequest(
      runtime,
      postData,
      consensusIdenticalAggregation<PostResponse>()
    )(runtime.config) // Call with config
    .result()

  runtime.log(`Successfully sent data to webhook. Status: ${result.statusCode}`)
  return "Success"
}

const initWorkflow = (config: Config) => {
  return [
    cre.handler(
      new cre.capabilities.CronCapability().trigger({
        schedule: config.schedule,
      }),
      onCronTrigger
    ),
  ]
}

export async function main() {
  const runner = await Runner.newRunner<Config>({
    configSchema,
  })
  await runner.run(initWorkflow)
}

main()
```

## Project structure
A typical CRE TypeScript project is organized as follows:
```text
myProject/
├── .env                    # Secret values (never commit to a Version Control System like Git)
├── .gitignore
├── project.yaml            # Global configuration
├── secrets.yaml            # Secret name declarations
├── contracts/              # Contract-related files
│   └── abi/                # TypeScript ABI definitions (.ts files)
│       ├── MessageEmitter.ts
│       ├── index.ts
│       └── …
├── workflow1/
│   ├── package.json        # NPM dependencies for this workflow
│   ├── tsconfig.json       # TypeScript configuration
│   ├── bun.lock            # Dependency lock file
│   ├── node_modules/       # Installed dependencies
│   ├── workflow.yaml       # Workflow-specific configuration (optional)
│   ├── main.ts             # Your workflow code
│   └── …
├── workflow2/
│   ├── package.json        # NPM dependencies for this workflow
│   ├── tsconfig.json       # TypeScript configuration
│   ├── bun.lock            # Dependency lock file
│   ├── node_modules/       # Installed dependencies
│   ├── workflow.yaml       # Workflow-specific configuration (optional)
│   ├── main.ts             # Your workflow code
│   └── …
└── …
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
import { cre, Runner, type Runtime } from "@chainlink/cre-sdk"

// Config can be an empty object if you don't need any parameters from config.json
type Config = Record<string, never>

// Define the logical name of the secret as a constant for clarity
const SECRET_NAME = "SECRET_ADDRESS"

// onCronTrigger is the callback function that gets executed when the cron trigger fires
// This is where you use the secret
const onCronTrigger = (runtime: Runtime<Config>): string => {
  // Call runtime.getSecret with the secret's logical ID
  const secret = runtime.getSecret({ id: SECRET_NAME }).result()

  // Use the secret's value
  const secretAddress = secret.value
  runtime.log(`Successfully fetched a secret! Address: ${secretAddress}`)

  // ... now you can use the secretAddress in your logic ...
  return "Success"
}

// initWorkflow is the entry point for the workflow
const initWorkflow = () => {
  const cron = new cre.capabilities.CronCapability()

  return [cre.handler(cron.trigger({ schedule: "0 */10 * * * *" }), onCronTrigger)]
}

// main is the entry point for the WASM binary
export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}

main()
```

### Secrets Limits

| Resource                        | Limit |
| ------------------------------- | ----- |
| Total secrets size per workflow | 1 MB  |
| Concurrent secret fetches       | 5     |
| Secrets per account             | 100   |

## Quick reference: Common pitfalls in non-determinism 

| Don't Use                    | Use Instead                                  |
| ---------------------------- | -------------------------------------------- |
| Unordered object iteration   | Sort keys first, then iterate                |
| `Promise.race()`             | Call `.result()` in deterministic order      |
| `Date.now()` or `new Date()` | `runtime.now()`                              |
| LLM free-text responses      | Structured output with field-level consensus |

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
