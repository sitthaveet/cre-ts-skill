#!/bin/bash
# Analyze workflow for potential CRE limit violations
# Usage: ./analyze-limits.sh <workflow-path>
# Output: JSON with warnings about potential limit issues

WORKFLOW_PATH="${1:-.}"

analyze_limits() {
    local warnings=()
    local info=()

    # Find TypeScript files
    local ts_files=$(find "$WORKFLOW_PATH" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null)

    if [[ -z "$ts_files" ]]; then
        echo "{\"success\": true, \"path\": \"$WORKFLOW_PATH\", \"warnings\": [], \"info\": [\"No TypeScript files found\"]}"
        return
    fi

    # Count HTTP calls (httpClient.fetch patterns)
    local http_calls=$(grep -r "httpClient\|\.fetch\|HTTPClient" $ts_files 2>/dev/null | wc -l | tr -d ' ')
    if [[ $http_calls -gt 5 ]]; then
        warnings+=("Found $http_calls potential HTTP call sites - limit is 5 per execution")
    elif [[ $http_calls -gt 0 ]]; then
        info+=("Found $http_calls HTTP call site(s) - limit is 5 per execution")
    fi

    # Count EVM operations
    local evm_reads=$(grep -r "evmClient\|\.read\|EVMClient\|readContract" $ts_files 2>/dev/null | wc -l | tr -d ' ')
    if [[ $evm_reads -gt 10 ]]; then
        warnings+=("Found $evm_reads potential EVM read sites - limit is 10 per execution")
    elif [[ $evm_reads -gt 0 ]]; then
        info+=("Found $evm_reads EVM operation site(s) - limit is 10 reads per execution")
    fi

    # Check for large data operations
    local json_parse=$(grep -r "JSON\.parse\|JSON\.stringify" $ts_files 2>/dev/null | wc -l | tr -d ' ')
    if [[ $json_parse -gt 10 ]]; then
        warnings+=("Heavy JSON operations ($json_parse sites) - watch memory usage (100MB limit)")
    fi

    # Check for loops that might cause timeout
    local loops=$(grep -r "while\s*(\|for\s*(" $ts_files 2>/dev/null | wc -l | tr -d ' ')
    if [[ $loops -gt 5 ]]; then
        warnings+=("Found $loops loop constructs - ensure they complete within 5 minute timeout")
    fi

    # Check for console.log (limited in CRE)
    local logs=$(grep -r "console\.log\|console\.error" $ts_files 2>/dev/null | wc -l | tr -d ' ')
    if [[ $logs -gt 20 ]]; then
        warnings+=("Found $logs console log calls - log lines are limited per execution")
    fi

    # Check for secrets usage
    local secrets=$(grep -r "getSecret\|runtime\.getSecret" $ts_files 2>/dev/null | wc -l | tr -d ' ')
    if [[ $secrets -gt 0 ]]; then
        info+=("Uses $secrets secret(s) - max 100 secrets per account")
    fi

    # Build JSON output
    local warnings_json=$(printf '%s\n' "${warnings[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]")
    local info_json=$(printf '%s\n' "${info[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]")

    echo "{\"success\": true, \"path\": \"$WORKFLOW_PATH\", \"warnings\": $warnings_json, \"info\": $info_json, \"files_analyzed\": $(echo "$ts_files" | wc -l | tr -d ' ')}"
}

# Check if jq is available for JSON formatting
if ! command -v jq &> /dev/null; then
    echo "{\"success\": false, \"error\": \"jq is required but not installed\"}"
    exit 1
fi

analyze_limits
