#!/bin/bash
# Wrapper for CRE workflow simulation
# Usage: ./simulate-workflow.sh [workflow-path] [additional-args...]
# Default: Uses current directory and --target staging-settings
# Output: CLI output from cre workflow simulate

WORKFLOW_PATH="${1:-.}"
shift 2>/dev/null || true
EXTRA_ARGS="$@"

# Default target if --target is not specified in extra args
DEFAULT_TARGET="staging-settings"

simulate_workflow() {
    # Check if CRE CLI is installed
    if ! command -v cre &> /dev/null; then
        echo "{\"success\": false, \"error\": \"CRE CLI not installed. Run ./scripts/check-cre-cli.sh for installation instructions\"}"
        exit 1
    fi

    # Check if workflow path exists
    if [[ ! -d "$WORKFLOW_PATH" ]]; then
        echo "{\"success\": false, \"error\": \"Workflow path not found: $WORKFLOW_PATH\"}"
        exit 1
    fi

    # Build command args - use default target unless --target is already specified
    if [[ "$EXTRA_ARGS" == *"--target"* ]]; then
        CMD_ARGS="$EXTRA_ARGS"
    else
        CMD_ARGS="--target $DEFAULT_TARGET $EXTRA_ARGS"
    fi

    # Run simulation
    echo "Running: cre workflow simulate $WORKFLOW_PATH $CMD_ARGS"
    echo "---"

    cd "$WORKFLOW_PATH" && cre workflow simulate . $CMD_ARGS

    EXIT_CODE=$?
    echo "---"
    if [[ $EXIT_CODE -eq 0 ]]; then
        echo "Simulation completed successfully"
    else
        echo "Simulation failed with exit code: $EXIT_CODE"
    fi

    exit $EXIT_CODE
}

simulate_workflow
