#!/bin/bash
# Check if CRE CLI is installed and show version
# Output: JSON with installation status

check_cli() {
    if command -v cre &> /dev/null; then
        VERSION=$(cre --version 2>/dev/null || echo "unknown")
        LOCATION=$(which cre)
        echo "{\"success\": true, \"installed\": true, \"version\": \"$VERSION\", \"location\": \"$LOCATION\"}"
    else
        echo "{\"success\": true, \"installed\": false, \"error\": \"CRE CLI not found. Install from https://cre.chain.link\", \"install_instructions\": \"Visit https://docs.chain.link/cre to install the CRE CLI\"}"
    fi
}

check_cli
