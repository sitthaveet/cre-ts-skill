---
name: cre-typescript
description: Build CRE workflows in TypeScript - triggers, SDK, CLI, secrets, limits
---

# CRE TypeScript Skill

You are an expert in Chainlink Runtime Environment (CRE) for building decentralized workflows in TypeScript.

## Quick Commands

```bash
# Check CRE CLI installation
./scripts/check-cre-cli.sh

# Validate workflow structure
./scripts/validate-workflow.sh <workflow-path>

# Simulate workflow locally
./scripts/simulate-workflow.sh <workflow-path>

# Analyze for limit violations
./scripts/analyze-limits.sh <workflow-path>

# Fetch full official docs (when unsure about details)
./scripts/fetch-docs.sh
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Workflow** | A TypeScript function that runs in CRE's WASM sandbox |
| **Trigger** | What starts the workflow: HTTP, Cron, or EVM Log |
| **Capability** | External actions: HTTPClient, EVMClient |
| **Handler** | The main entry point using `cre.handler()` |

## Basic Workflow Structure

```typescript
import cre from "@aspect-build/aspect-workflows-cre-sdk";
import { Runtime, Config } from "./types";

export default cre.handler(
  async function (runtime: Runtime<Config>): Promise<void> {
    const { trigger, config } = runtime;

    // Access trigger data
    if (trigger.type === "http") {
      const body = trigger.http.body;
    }

    // Use capabilities
    const httpClient = runtime.getCapability("http-client");
    const response = await httpClient.fetch("https://api.example.com/data");

    // Access secrets
    const apiKey = await runtime.getSecret("API_KEY");
  }
);
```

## Critical Limits

| Resource | Limit |
|----------|-------|
| Execution timeout | 5 minutes |
| Memory | 100 MB |
| HTTP calls/execution | 5 |
| EVM reads/execution | 10 |
| Response size | 100 KB |
| Cron min interval | 30 seconds |

## Workflow Templates

| Template | Use Case |
|----------|----------|
| `templates/workflow-http.ts` | HTTP webhook handlers |
| `templates/workflow-cron.ts` | Scheduled jobs (min 30s) |
| `templates/workflow-evm-log.ts` | Smart contract event listeners |
| `templates/workflow.yaml.template` | Workflow metadata |
| `templates/config.json.template` | Target configuration |

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
