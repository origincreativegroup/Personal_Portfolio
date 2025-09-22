#!/bin/bash

# PortfolioForge - Simplified macOS Startup Script
# For the new simplified architecture with React frontend + Fastify backend

# Colors for beautiful terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
INFO="ℹ️"
GEAR="⚙️"
SPARKLES="✨"

# Resolve project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

cd "$PROJECT_ROOT"

# Function to print styled output
print_header() {
    echo ""
    echo -e "${PURPLE}${1}${NC}"
    echo -e "${PURPLE}$(echo "$1" | sed 's/./-/g')${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

print_step() {
    echo -e "${CYAN}${GEAR} $1${NC}"
}

# Function to check if running on macOS
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This script is optimized for macOS. Use start-simplified.sh for other platforms."
        exit 1
    fi
}

# Function to check if a port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        print_warning "Stopping existing processes on port $port"
        echo $pids | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking system requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        print_info "Install using: brew install node"
        print_info "Or download from: https://nodejs.org/"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi

    print_success "Node.js $(node --version) and npm $(npm --version) are ready"
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."

    # Install all workspace dependencies at once
    print_info "Installing all workspace dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi

    print_success "All workspace dependencies installed"
}

# Function to setup database
setup_database() {
    if [ -d "backend" ] && [ -f "backend/prisma/schema.prisma" ]; then
        print_step "Setting up database..."

        # Generate Prisma client
        print_info "Generating Prisma client..."
        cd backend
        npx prisma generate 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "Prisma client generated"
        else
            print_warning "Failed to generate Prisma client (will try to continue)"
        fi

        # Push database schema
        if [ ! -f "dev.db" ]; then
            print_info "Creating database..."
            npx prisma db push 2>/dev/null
            if [ $? -eq 0 ]; then
                print_success "Database created"
            else
                print_warning "Failed to create database (will try to continue)"
            fi
        fi
        cd ..

        print_success "Database setup complete"
    fi
}

# Function to start backend
start_backend() {
    print_step "Starting backend server..."

    kill_port 3001

    # Create logs directory if it doesn't exist
    mkdir -p logs

    # Start backend using workspace command
    npm run dev:backend > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    print_success "Backend started (PID: $BACKEND_PID)"

    # Wait and verify
    sleep 3
    if check_port 3001; then
        print_success "Backend is running at http://localhost:3001"
    else
        print_warning "Backend may not have started properly. Check logs/backend.log"
    fi
}

# Function to start frontend
start_frontend() {
    print_step "Starting frontend development server..."

    kill_port 3000

    # Start frontend using workspace command
    npm run dev:frontend > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    print_success "Frontend started (PID: $FRONTEND_PID)"

    # Wait and verify
    sleep 3
    if check_port 3000; then
        print_success "Frontend is running at http://localhost:3000"
    else
        # Frontend might be on a different port if 3000 is taken
        print_warning "Frontend may not have started properly. Check logs/frontend.log"
    fi
}

# Function to open in browser
open_browser() {
    if [ "$1" != "--no-browser" ]; then
        print_step "Opening PortfolioForge in your default browser..."
        sleep 2
        # Check which port the frontend is running on
        if check_port 3000; then
            open http://localhost:3000
        elif check_port 3001; then
            # Backend is on 3001, frontend might be on a different port
            # Check logs for actual port
            if [ -f "logs/frontend.log" ]; then
                FRONTEND_PORT=$(grep -o "http://localhost:[0-9]*" logs/frontend.log | head -n1 | grep -o "[0-9]*" | tail -n1)
                if [ ! -z "$FRONTEND_PORT" ]; then
                    open "http://localhost:$FRONTEND_PORT"
                fi
            fi
        fi
    fi
}

# Function to show status
show_status() {
    clear
    echo ""
    print_header "${ROCKET} PortfolioForge is Running!"
    echo ""
    echo -e "${WHITE}Services:${NC}"
    echo -e "  ${CYAN}React Frontend:${NC}        http://localhost:3000"
    echo -e "    ${WHITE}├─ Dashboard & Portfolio Management${NC}"
    echo -e "    ${WHITE}├─ AI-Powered Project Editor${NC}"
    echo -e "    ${WHITE}├─ Asset Management${NC}"
    echo -e "    ${WHITE}└─ GrapesJS Visual Editor${NC}"
    echo -e "  ${CYAN}Fastify Backend:${NC}       http://localhost:3001"
    echo -e "    ${WHITE}├─ REST API${NC}"
    echo -e "    ${WHITE}├─ Prisma Database${NC}"
    echo -e "    ${WHITE}└─ AI Services${NC}"
    echo ""
    echo -e "${WHITE}Process IDs:${NC}"
    echo -e "  ${CYAN}Frontend PID:${NC}  $FRONTEND_PID"
    echo -e "  ${CYAN}Backend PID:${NC}   $BACKEND_PID"
    echo ""
    echo -e "${WHITE}Logs:${NC}"
    echo -e "  ${CYAN}Frontend:${NC} logs/frontend.log"
    echo -e "  ${CYAN}Backend:${NC}  logs/backend.log"
    echo ""
    echo -e "${WHITE}AI Features:${NC}"
    echo -e "  ${CYAN}Project Analysis:${NC}       AI-powered insights and suggestions"
    echo -e "  ${CYAN}Narrative Generation:${NC}   AI case study narratives"
    echo -e "  ${CYAN}Executive Summaries:${NC}    AI-generated project summaries"
    echo -e "  ${CYAN}File Analysis:${NC}          AI file content analysis"
    echo ""
    echo -e "${YELLOW}Press ${WHITE}Ctrl+C${YELLOW} to stop all services${NC}"
    echo -e "${YELLOW}Press ${WHITE}Cmd+T${YELLOW} to open a new terminal tab${NC}"
    echo ""
}

# Function to monitor services
monitor_services() {
    while true; do
        # Check if processes are still running
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            print_error "Frontend process stopped unexpectedly"
            break
        fi

        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            print_error "Backend process stopped unexpectedly"
            break
        fi

        sleep 5
    done
}

# Function to cleanup
cleanup() {
    echo ""
    print_warning "Shutting down PortfolioForge..."

    # Kill processes gracefully
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_info "Frontend server stopped"
    fi

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_info "Backend server stopped"
    fi

    # Cleanup any remaining processes
    kill_port 3000
    kill_port 3001

    print_success "All services stopped cleanly"
    echo ""
    print_info "Thanks for using PortfolioForge! ${SPARKLES}"
    exit 0
}

# Function to show help
show_help() {
    echo ""
    print_header "${ROCKET} PortfolioForge - Simplified macOS Startup"
    echo ""
    echo -e "${WHITE}Usage:${NC} $0 [OPTIONS]"
    echo ""
    echo -e "${WHITE}Options:${NC}"
    echo -e "  ${CYAN}--no-browser${NC}    Don't automatically open browser"
    echo -e "  ${CYAN}--help, -h${NC}      Show this help message"
    echo -e "  ${CYAN}--logs${NC}          Show service logs in real-time"
    echo -e "  ${CYAN}--clean${NC}         Clean install (remove node_modules first)"
    echo ""
    echo -e "${WHITE}Services:${NC}"
    echo -e "  ${CYAN}React Frontend:${NC}        Vite development server on port 3000"
    echo -e "  ${CYAN}Fastify Backend:${NC}       API server on port 3001"
    echo ""
    echo -e "${WHITE}Features:${NC}"
    echo -e "  ${CYAN}AI-Powered:${NC}            Project analysis, narrative generation"
    echo -e "  ${CYAN}Visual Editor:${NC}         GrapesJS drag-and-drop builder"
    echo -e "  ${CYAN}Asset Management:${NC}      File upload and organization"
    echo -e "  ${CYAN}Database:${NC}              SQLite with Prisma ORM"
    echo ""
    echo -e "${WHITE}Troubleshooting:${NC}"
    echo -e "  ${CYAN}tail -f logs/frontend.log${NC}  View frontend logs"
    echo -e "  ${CYAN}tail -f logs/backend.log${NC}   View backend logs"
    echo ""
    exit 0
}

# Function to show logs
show_logs() {
    print_info "Starting log viewer... (Press Ctrl+C to return to main script)"
    if [ -f "logs/frontend.log" ] && [ -f "logs/backend.log" ]; then
        tail -f logs/frontend.log logs/backend.log
    else
        print_warning "Log files not found. Start the services first."
    fi
}

# Function to clean install
clean_install() {
    print_warning "Performing clean installation..."
    print_step "Removing node_modules directories..."
    rm -rf node_modules frontend/node_modules backend/node_modules shared/node_modules src/node_modules
    rm -rf backend/dev.db backend/prisma/migrations
    rm -rf package-lock.json frontend/package-lock.json backend/package-lock.json shared/package-lock.json src/package-lock.json
    print_success "Cleanup complete"
    install_dependencies
    setup_database
}

# Main execution
main() {
    # Set trap for cleanup
    trap cleanup INT TERM EXIT

    # Check if running on macOS
    check_macos

    # Clear terminal for clean start
    clear

    print_header "${SPARKLES} PortfolioForge - Simplified Architecture"

    # Check prerequisites
    check_prerequisites

    # Install dependencies
    install_dependencies

    # Setup database
    setup_database

    # Create logs directory
    mkdir -p logs

    # Start services
    start_backend
    start_frontend

    # Open browser
    open_browser "$@"

    # Show status
    show_status

    # Monitor services
    monitor_services
}

# Parse command line arguments
case "$1" in
    --help|-h)
        show_help
        ;;
    --logs)
        show_logs
        ;;
    --clean)
        clean_install
        main "$@"
        ;;
    *)
        main "$@"
        ;;
esac
