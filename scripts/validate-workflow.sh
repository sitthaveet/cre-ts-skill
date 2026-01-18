#!/bin/bash
# Validate CRE workflow structure
# Usage: ./validate-workflow.sh <workflow-path>
# Output: JSON with validation results

WORKFLOW_PATH="${1:-.}"

validate_workflow() {
    local errors=()
    local warnings=()
    local found_files=()

    # Check required files
    if [[ -f "$WORKFLOW_PATH/workflow.yaml" ]]; then
        found_files+=("workflow.yaml")
    else
        errors+=("Missing workflow.yaml")
    fi

    # Check for TypeScript entry point
    if [[ -f "$WORKFLOW_PATH/src/index.ts" ]]; then
        found_files+=("src/index.ts")
    elif [[ -f "$WORKFLOW_PATH/index.ts" ]]; then
        found_files+=("index.ts")
    else
        errors+=("Missing TypeScript entry point (src/index.ts or index.ts)")
    fi

    # Check for package.json
    if [[ -f "$WORKFLOW_PATH/package.json" ]]; then
        found_files+=("package.json")
    else
        warnings+=("Missing package.json - may need npm init")
    fi

    # Check for tsconfig.json
    if [[ -f "$WORKFLOW_PATH/tsconfig.json" ]]; then
        found_files+=("tsconfig.json")
    else
        warnings+=("Missing tsconfig.json - TypeScript config recommended")
    fi

    # Check for config directory
    if [[ -d "$WORKFLOW_PATH/config" ]]; then
        found_files+=("config/")
        if [[ -f "$WORKFLOW_PATH/config/config.json" ]]; then
            found_files+=("config/config.json")
        else
            warnings+=("config/ exists but no config.json found")
        fi
    fi

    # Build JSON output
    local errors_json=$(printf '%s\n' "${errors[@]}" | jq -R . | jq -s .)
    local warnings_json=$(printf '%s\n' "${warnings[@]}" | jq -R . | jq -s .)
    local files_json=$(printf '%s\n' "${found_files[@]}" | jq -R . | jq -s .)

    if [[ ${#errors[@]} -eq 0 ]]; then
        echo "{\"success\": true, \"valid\": true, \"path\": \"$WORKFLOW_PATH\", \"found_files\": $files_json, \"errors\": [], \"warnings\": $warnings_json}"
    else
        echo "{\"success\": true, \"valid\": false, \"path\": \"$WORKFLOW_PATH\", \"found_files\": $files_json, \"errors\": $errors_json, \"warnings\": $warnings_json}"
    fi
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "{\"success\": false, \"error\": \"jq is required but not installed\"}"
    exit 1
fi

validate_workflow
