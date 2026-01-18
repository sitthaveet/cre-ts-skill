#!/bin/bash

# Returns the list of available chain selectors

# Format: "Chain Name|Selector Name|Selector ID"
# Data extracted from original file content
chains=(
    "Arbitrum One|ethereum-mainnet-arbitrum-1|4949039107694359620"
    "Arbitrum Sepolia|ethereum-testnet-sepolia-arbitrum-1|3478487238524512106"
    "Avalanche Mainnet|avalanche-mainnet|6433500567565415381"
    "Avalanche Fuji|avalanche-testnet-fuji|14767482510784806043"
    "Base Mainnet|ethereum-mainnet-base-1|15971525489660198786"
    "Base Sepolia|ethereum-testnet-sepolia-base-1|10344971235874465080"
    "BNB Chain Mainnet|binance_smart_chain-mainnet|11344663589394136015"
    "BNB Chain Testnet|binance_smart_chain-testnet|5142893604156789321"
    "Ethereum Mainnet|ethereum-mainnet|5009297550715157269"
    "Ethereum Sepolia|ethereum-testnet-sepolia|16015286601757825753"
    "OP Mainnet|ethereum-mainnet-optimism-1|3734403246176062136"
    "OP Sepolia|ethereum-testnet-sepolia-optimism-1|5224473277236331295"
    "Polygon Mainnet|polygon-mainnet|4051577828743386545"
    "Polygon Amoy|polygon-testnet-amoy|16281711391670634445"
)

# Print header
printf "%-25s %-40s %-25s\n" "Chain" "String Name" "Numeric ID"
printf "%-25s %-40s %-25s\n" "-----" "-----------" "----------"

# Print rows
for chain in "${chains[@]}"; do
    IFS='|' read -r name selector_name selector_id <<< "$chain"
    printf "%-25s %-40s %-25s\n" "$name" "$selector_name" "$selector_id"
done