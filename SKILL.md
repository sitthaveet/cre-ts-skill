---
name: cre-typescript
description: Build Chainlink Runtime Environment (CRE) workflows in TypeScript - triggers, SDK, CLI, secrets
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
cre init --project-name my-cre-project --workflow-name my-workflow --template-id 3

# Check CRE CLI installation
./scripts/check-cre-cli.sh

# Validate workflow structure
./scripts/validate-workflow.sh <workflow-path>

# If user wants to run the workflow (simulate locally)
./scripts/simulate-workflow.sh <workflow-path>

# Get list of chain selectors (names and IDs)
./scripts/get-chain-selector.sh

# Fetch full official docs (fallback if topic-based lookup isn't enough)
./scripts/fetch-docs.sh
```

PS. workflow-path is a workflow-name or the folder that contains workflow.

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
} from "@chainlink/cre-sdk";
import { z } from "zod";

// Config schema
const configSchema = z.object({
  webhookUrl: z.string(),
  schedule: z.string(),
});

type Config = z.infer<typeof configSchema>;

// Data to be sent
type MyData = {
  message: string;
  value: number;
};

// Response for consensus
type PostResponse = {
  statusCode: number;
};

const postData = (
  sendRequester: HTTPSendRequester,
  config: Config,
): PostResponse => {
  // 1. Prepare the data to be sent
  const dataToSend: MyData = {
    message: "Hello there!",
    value: 77,
  };

  // 2. Serialize the data to JSON and encode as bytes
  const bodyBytes = new TextEncoder().encode(JSON.stringify(dataToSend));

  // 3. Convert to base64 for the request
  const body = Buffer.from(bodyBytes).toString("base64");

  // 4. Construct the POST request with cacheSettings
  const req = {
    url: config.webhookUrl,
    method: "POST" as const,
    body,
    headers: {
      "Content-Type": "application/json",
    },
    cacheSettings: {
      store: true, // IMPORTANT: Use 'store', not 'readFromCache'
      maxAge: { seconds: 60n }, // IMPORTANT: Use 'maxAge' (Duration type), not 'maxAgeMs'
    },
  };

  // 5. Send the request and wait for the response
  const resp = sendRequester.sendRequest(req).result();

  if (!ok(resp)) {
    throw new Error(`HTTP request failed with status: ${resp.statusCode}`);
  }

  return { statusCode: resp.statusCode };
};

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const httpClient = new cre.capabilities.HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      postData,
      consensusIdenticalAggregation<PostResponse>(),
    )(runtime.config) // IMPORTANT: sendRequest() returns a function that must be called with (config)
    .result();

  runtime.log(
    `Successfully sent data to webhook. Status: ${result.statusCode}`,
  );
  return "Success";
};

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
  const runner = await Runner.newRunner<Config>({
    configSchema,
  });
  await runner.run(initWorkflow);
}

main();
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

## Workflow Templates

| Template                                    | Use Case                                |
| ------------------------------------------- | --------------------------------------- |
| `templates/workflow-get-request.ts`         | HTTP GET request handlers               |
| `templates/workflow-post-request.ts`        | HTTP POST request handlers              |
| `templates/workflow-cron.ts`                | Scheduled jobs (min 30s)                |
| `templates/workflow-evm-log.ts`             | Smart contract event listeners          |
| `templates/workflow-using-secret.ts`        | Workflow using secrets example          |
| `templates/optimize-multiple-http-calls.ts` | Parallel multiple HTTP calls with median consensus for optimization |
| `templates/workflow.yaml.template`          | Workflow metadata                       |
| `templates/config.json.template`            | Target configuration                    |
| `templates/project.yaml.template`           | Project-level CLI targets (RPCs, DON)   |
| `templates/secrets.yaml.template`           | Secrets declaration                     |
| `templates/.env.template`                   | Environment variables for simulation    |

## Secrets Management

Secrets (API keys, credentials) are declared in `secrets.yaml` and accessed via `runtime.getSecret()`.

## Secrets Troubleshooting

### Common Issue: "secret not found" in simulation

If you encounter `error fetching [object Object]: secret not found` during local simulation:

1. **Most likely cause**: The key name and value name in `secrets.yaml` are the same. They **must be different** (e.g., `EVM_ADDRESS` key with `EVM_ADDRESS_ALL` value).
2. **Workaround for development**: Pass sensitive values via `config.json` temporarily.
3. **For production with secrets**: Use the `runInNodeMode` pattern which provides `NodeRuntime` with more robust secrets access.

## Important Notes

### HTTP Triggers Cannot Return Data

HTTP-triggered workflows do **not** return your workflow output in the response. You only get an acknowledgment:

```json
{
  "success": true,
  "response": {
    "workflow_id": "0x...",
    "workflow_execution_id": "0x...",
    "status": "ACCEPTED"
  }
}
```

If you need to send results back to a caller, use HTTPClient's `sendRequest` to make a callback to your service with the result. Be aware this counts toward the HTTP call quota (5 per execution).

### Deployment Requires Whitelisting

Only whitelisted accounts can deploy workflows to production CRE. You can simulate locally without restriction, but deploying to the DON requires Early Access approval from Chainlink.

### Service Quotas

CRE enforces strict limits. Design your workflows with these in mind:

**Per-Account:**
- Max **5 concurrent workflow executions** across all workflows
- Workflow triggers: 5 per second (burst: 5)
- Deploy: 1 workflow per minute
- Max binary size: 100 MB (20 MB compressed)

**Per-Workflow:**
- Triggers fire at 1 per 30 seconds (burst: 3), max 10 triggers per workflow
- 5-minute timeout, 100 MB memory
- Max 5 concurrent instances
- 100 KB response size limit

**Capabilities:**
- Max 3 concurrent capability calls
- HTTP: 5 calls per execution, 10 KB response, 100 KB request
- EVM read: 10 calls per execution, 100 blocks for log queries
- EVM write: 5M gas quota, 1 KB report size, 10 target chains

**Logging:**
- 1 KB per line, 1,000 events per execution

**EVM log triggers:**
- Max 5 per workflow, monitor up to 5 contract addresses

The 5-concurrent-execution limit means you must design queuing and retry logic in your application layer if you expect high throughput.

## Quick reference: Common pitfalls in non-determinism

| Don't Use                    | Use Instead                                  |
| ---------------------------- | -------------------------------------------- |
| Unordered object iteration   | Sort keys first, then iterate                |
| `Promise.race()`             | Call `.result()` in deterministic order      |
| `Date.now()` or `new Date()` | `runtime.now()`                              |
| LLM free-text responses      | Structured output with field-level consensus |

## Common Pitfalls Quick Reference

| Issue                      | Symptom                             | Solution                                               |
| -------------------------- | ----------------------------------- | ------------------------------------------------------ |
| Missing function call      | "not a function" error              | Add `(config)` after `sendRequest()`                   |
| Wrong cacheSettings fields | "key unknown" JSON error            | Use `store`/`maxAge`, not `readFromCache`/`maxAgeMs`   |
| POST body not encoded      | Empty or malformed request          | Base64 encode: `Buffer.from(bytes).toString("base64")` |
| Response body not decoded  | Cannot parse response               | Base64 decode: `Buffer.from(resp.body, "base64")`      |
| Multiple HTTP calls        | Inefficient consensus per call      | Batch all calls in one `sendRequest`, consensus once (see `optimize-multiple-http-calls.ts`) |
| Direct external calls      | nil pointer / panic error           | All external calls must go through capabilities (HTTPClient, EVMClient)                      |
| HTTP trigger returns data  | Only get "ACCEPTED" status          | Use HTTPClient callback to send results to your service                                      |
| EVM calls fail in sim      | EVM errors during simulation        | Add `--broadcast` flag to simulate command                                                   |

## Runtime Documentation Lookup

When you need more details about CRE (CLI options, SDK types, trigger configs, etc.):

1. **Match the user's question to a reference file** from the table below
2. **Read the matching reference file** (e.g., `references/workflow-building.md`)
3. **WebFetch 3-5 URLs** from that file — pick URLs whose labels best match the question
4. **Synthesize a response** using the fetched content, citing source URLs

Do NOT rely on cached content. Always WebFetch to get the latest information.

| File | Topic | When to use |
|------|-------|-------------|
| `references/account-setup.md` | Account setup | Creating accounts, CLI login, auth |
| `references/getting-started.md` | Getting started | CLI install, project setup, tutorial |
| `references/capabilities.md` | Capabilities | EVM read/write, HTTP, triggers overview |
| `references/workflow-building.md` | Workflow building | Secrets, time, triggers, HTTP/EVM clients, reports |
| `references/cli-reference.md` | CLI reference | CLI commands for setup, secrets, workflows |
| `references/sdk-reference.md` | SDK reference | SDK core, consensus, EVM/HTTP clients, triggers |
| `references/operations.md` | Operations | Deploy, simulate, monitor, activate, pause, delete |
| `references/concepts.md` | Concepts | Consensus, finality, non-determinism, WASM runtime |
| `references/organization.md` | Organization | Org management, members, wallet keys |
| `references/general.md` | General | CRE overview, key terms, templates, networks, quotas |

**Tips:**
- For workflow generation: start with `workflow-building.md`, supplement with `sdk-reference.md`
- For onboarding: start with `getting-started.md`, then `account-setup.md`
- Full docs index at `assets/cre-docs-index.md` if you need to search across all URLs
- Fallback: `./scripts/fetch-docs.sh` downloads the full docs if the topic-based approach isn't enough
