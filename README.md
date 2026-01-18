# Chainlink Runtime Environment (CRE) Claude Code Skill

A Claude Code Skill that makes Claude an expert in Chainlink Runtime Environment (CRE), enabling developers to build, test, and deploy CRE workflows efficiently.

## Overview

This skill provides Claude with knowledge about CRE, including:
- TypeScript SDK for building workflows
- CLI commands for development and deployment
- Trigger types (HTTP, Cron, EVM Log)
- Capabilities (HTTPClient, EVMClient)
- Secrets management and limits

## Installation

Install this skill to make it available to Claude Code.

### Method 1: Git Clone

```bash
# Clone the repository
git clone https://github.com/sitthaveet/cre-ts-skill.git

# Copy to Claude Code skills directory
mkdir -p ~/.claude/skills
cp -r cre-ts-skill ~/.claude/skills/
```

### Method 2: Direct Download

```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.claude/skills/cre-ts-skill

# Fetch and extract from GitHub
curl -L https://github.com/sitthaveet/cre-ts-skill/archive/main.tar.gz | \
  tar xz -C ~/.claude/skills/cre-ts-skill --strip-components=1
```

After installation, restart Claude Code or run `/skills reload` to load the skill.

## Quick Start

### 1. Check CRE CLI Installation

```bash
./scripts/check-cre-cli.sh
```

### 2. Create a New Workflow

Initialize a new CRE project:

```bash
cre init
```

### 3. Validate Your Workflow

```bash
./scripts/validate-workflow.sh my-workflow/
```

### 4. Simulate Locally

```bash
./scripts/simulate-workflow.sh my-workflow/
```

## Directory Structure

```
cre-ts-skill/
├── SKILL.md                     # Main skill definition for Claude
├── CLAUDE.md                    # Project guidelines
├── README.md                    # This file
├── scripts/
│   ├── fetch-docs.sh            # Fetch full docs from chain.link
│   ├── check-cre-cli.sh         # Verify CRE CLI installation
│   ├── validate-workflow.sh     # Validate workflow structure
│   ├── simulate-workflow.sh     # Run simulation wrapper
│   └── analyze-limits.sh        # Check for limit violations
├── templates/
│   ├── workflow-http.ts         # HTTP trigger template
│   ├── workflow-cron.ts         # Cron trigger template
│   ├── workflow-evm-log.ts      # EVM log trigger template
│   ├── workflow.yaml.template   # Workflow metadata template
│   └── config.json.template     # Target config template
└── .claude/
    └── settings.local.json      # Claude Code permissions
```

## Scripts

All scripts output JSON for easy parsing.

| Script | Purpose |
|--------|---------|
| `fetch-docs.sh` | Download full CRE docs to `/tmp/cre-docs-full.txt` |
| `check-cre-cli.sh` | Check if CRE CLI is installed and show version |
| `validate-workflow.sh` | Validate workflow directory structure |
| `simulate-workflow.sh` | Run `cre workflow simulate` with helpful output |
| `analyze-limits.sh` | Static analysis for potential limit issues |

## Templates

| Template | Use Case |
|----------|----------|
| `workflow-http.ts` | Webhook handlers, REST APIs |
| `workflow-cron.ts` | Scheduled jobs (min 30s interval) |
| `workflow-evm-log.ts` | React to smart contract events |
| `workflow.yaml.template` | Workflow configuration |
| `config.json.template` | Runtime configuration |

## CRE Limits (Quick Reference)

| Resource | Limit |
|----------|-------|
| Execution timeout | 5 minutes |
| Memory | 100 MB |
| HTTP calls/execution | 5 |
| EVM reads/execution | 10 |
| Response size | 100 KB |
| Cron min interval | 30 seconds |

## Documentation

This skill uses on-demand documentation fetching. When Claude needs detailed information, it runs `./scripts/fetch-docs.sh` to get the latest official docs from:

https://docs.chain.link/cre/llms-full-ts.txt

This approach ensures Claude always has access to up-to-date information without maintaining local docs that can go stale.

## Requirements

- Node.js >= 18.0.0
- CRE CLI (install from https://docs.chain.link/cre)
- `jq` (for script JSON processing)

## License

MIT
