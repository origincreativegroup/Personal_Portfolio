#!/bin/bash

# Portfolio Forge - Universal Launcher
# This script can be run from anywhere and will navigate to the project directory

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚀 Portfolio Forge Universal Launcher${NC}"
echo -e "${BLUE}Navigating to project directory: $SCRIPT_DIR${NC}"

# Change to the project directory
cd "$SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -f "start-macos.sh" ]; then
    echo -e "${RED}❌ Error: start-macos.sh not found in $SCRIPT_DIR${NC}"
    echo "Please make sure this script is in the Portfolio Forge root directory."
    exit 1
fi

echo -e "${GREEN}✅ Found Portfolio Forge project${NC}"
echo ""

# Run the main startup script with all arguments passed through
exec ./start-macos.sh "$@"