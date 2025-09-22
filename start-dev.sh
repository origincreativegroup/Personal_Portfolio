#!/bin/bash

# PortfolioForge - Simple Development Startup
# Uses the root package.json dev script with concurrently

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting PortfolioForge Development Environment${NC}"
echo -e "${YELLOW}⚙️  Installing dependencies...${NC}"

# Install dependencies
npm install

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${YELLOW}🔧 Starting both frontend and backend...${NC}"

# Start both services using concurrently
npm run dev

echo -e "${GREEN}✅ PortfolioForge services stopped${NC}"