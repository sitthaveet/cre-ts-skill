# Chainlink Runtime Environment (CRE) Agent Skill

An Agent Skill that makes your agent an expert in Chainlink Runtime Environment (CRE), enabling developers to build, test, and deploy CRE workflows efficiently.

## Overview

This skill provides your agent with knowledge about CRE, including:

- TypeScript SDK for building workflows
- CLI commands for development and deployment
- Trigger types (HTTP, Cron, EVM Log)
- Capabilities (HTTPClient, EVMClient)
- Secrets management
- Get chain selector name and id that provided by Chainlink
- Optimal way to run multiple http calls

## Installation

Use one of the installation paths below, depending on your agent.

### Claude Code

Install into `~/.claude/skills`.

#### Method 1: Git Clone

```bash
# Clone the repository
git clone https://github.com/sitthaveet/cre-ts-skill.git

# Copy to Claude Code skills directory
mkdir -p ~/.claude/skills
cp -r cre-ts-skill ~/.claude/skills/
```

#### Method 2: Direct Download

```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.claude/skills/cre-ts-skill

# Fetch and extract from GitHub
curl -L https://github.com/sitthaveet/cre-ts-skill/archive/main.tar.gz | \
  tar xz -C ~/.claude/skills/cre-ts-skill --strip-components=1
```

After installation, restart Claude Code or run `/skills reload` to load the skill.

### Codex

Install into `$CODEX_HOME/skills` (default: `~/.codex/skills`).

#### Method 1: Git Clone

```bash
# Clone the repository
git clone https://github.com/sitthaveet/cre-ts-skill.git

# Copy to Codex skills directory
mkdir -p ~/.codex/skills
cp -r cre-ts-skill ~/.codex/skills/
```

#### Method 2: Direct Download

```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.codex/skills/cre-ts-skill

# Fetch and extract from GitHub
curl -L https://github.com/sitthaveet/cre-ts-skill/archive/main.tar.gz | \
  tar xz -C ~/.codex/skills/cre-ts-skill --strip-components=1
```

After installation, restart Codex to pick up new skills.

### Cursor

Cursor supports project-level agent instructions via `AGENTS.md` in your project root.

```bash
# Run from your Cursor project root
curl -fsSL https://raw.githubusercontent.com/sitthaveet/cre-ts-skill/main/SKILL.md | \
  awk 'BEGIN{infm=0} NR==1 && $0=="---"{infm=1; next} infm && $0=="---"{infm=0; next} !infm{print}' > AGENTS.md
```

After installation, start a new chat in Cursor so the new instructions are loaded.

## Quick Start

### 1. Check CRE CLI Installation

```bash
./scripts/check-cre-cli.sh
```

### 2. Create a New Workflow

Initialize a new CRE project:

```bash
cre init --project-name my-cre-project --workflow-name my-workflow --template-id 3
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
├── SKILL.md                     # Main skill definition for the agent
├── README.md                    # This file
├── scripts/
│   ├── fetch-docs.sh            # Fetch full docs from chain.link
│   ├── check-cre-cli.sh         # Verify CRE CLI installation
│   ├── validate-workflow.sh     # Validate workflow structure
│   ├── simulate-workflow.sh     # Run simulation wrapper
│   ├── analyze-limits.sh        # Check for limit violations
│   └── get-chain-selector.sh    # Get chain selector name and id
├── templates/
│   ├── workflow-get-request.ts  # HTTP GET request template
│   ├── workflow-post-request.ts # HTTP POST request template
│   ├── workflow-cron.ts         # Cron trigger template
│   ├── workflow-evm-log.ts      # EVM log trigger template
│   ├── workflow.yaml.template   # Workflow metadata template
│   ├── config.json.template     # Target configuration template
│   ├── project.yaml.template    # Project-level CLI targets
│   ├── secrets.yaml.template    # Secrets declaration template
│   └── .env.template            # Environment variables template
└── .claude/
    └── settings.local.json      # Agent permissions
```

## Scripts

All scripts output JSON for easy parsing.

| Script                  | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `fetch-docs.sh`         | Download full CRE docs to `/tmp/cre-docs-full.txt`        |
| `check-cre-cli.sh`      | Check if CRE CLI is installed and show version            |
| `validate-workflow.sh`  | Validate workflow directory structure                     |
| `simulate-workflow.sh`  | Run `cre workflow simulate` with helpful output           |
| `analyze-limits.sh`     | Static analysis for potential limit issues                |
| `get-chain-selector.sh` | Get chain selector name and id that provided by Chainlink |

## Templates

| Template                         | Use Case                                  |
| -------------------------------- | ----------------------------------------- |
| `workflow-get-request.ts`        | HTTP GET request example                  |
| `workflow-post-request.ts`       | HTTP POST request example                 |
| `workflow-cron.ts`               | Scheduled jobs (min 30s interval)         |
| `workflow-evm-log.ts`            | React to smart contract events            |
| `optimize-multiple-http-calls.ts`| Parallel HTTP calls with median consensus |
| `workflow.yaml.template`         | Workflow metadata configuration           |
| `config.json.template`           | Target configuration                      |
| `project.yaml.template`          | Project-level CLI targets (RPCs, DON)     |
| `secrets.yaml.template`          | Secrets declaration                       |
| `.env.template`                  | Environment variables for simulation      |

## CRE Limits (Quick Reference)

| Resource             | Limit      |
| -------------------- | ---------- |
| Execution timeout    | 5 minutes  |
| Memory               | 100 MB     |
| HTTP calls/execution | 5          |
| EVM reads/execution  | 10         |
| Response size        | 100 KB     |
| Cron min interval    | 30 seconds |

## Documentation

This skill uses on-demand documentation fetching. When the agent needs detailed information, it runs `./scripts/fetch-docs.sh` to get the latest official docs from:

https://docs.chain.link/cre/llms-full-ts.txt

This approach ensures the agent always has access to up-to-date information without maintaining local docs that can go stale.

## Requirements

- Bun >= 1.2.21 (install from https://bun.sh)
- CRE CLI (install from https://docs.chain.link/cre)
- `jq` (for script JSON processing)

## License

MIT
