#!/bin/bash

# Portfolio Forge - macOS Startup Script
# Optimized for macOS users with native features

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

if [ -f "$PROJECT_ROOT/apps/web/package.json" ]; then
    FRONTEND_DIR="$PROJECT_ROOT/apps/web"
elif [ -f "$PROJECT_ROOT/portfolio-intake/package.json" ]; then
    FRONTEND_DIR="$PROJECT_ROOT/portfolio-intake"
else
    FRONTEND_DIR="$PROJECT_ROOT"
fi

FRONTEND_NAME="$(basename "$FRONTEND_DIR")"

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
        print_error "This script is optimized for macOS. Use start.sh for other platforms."
        exit 1
    fi
}

# Function to check if a port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to kill processes on specific ports with macOS-specific commands
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        print_warning "Stopping existing processes on port $port"
        echo $pids | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Function to check prerequisites with macOS-specific paths
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

    # Check if Homebrew is available (optional but recommended)
    if command -v brew &> /dev/null; then
        print_info "Homebrew detected: $(brew --version | head -n1)"
    fi

    print_success "Node.js $(node --version) and npm $(npm --version) are ready"
}

# Function to install dependencies with progress
install_dependencies() {
    print_step "Installing dependencies..."

    # Frontend dependencies
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_info "Installing frontend dependencies for $FRONTEND_NAME..."
        pushd "$FRONTEND_DIR" >/dev/null
        npm install --silent
        if [ $? -eq 0 ]; then
            print_success "Frontend dependencies installed"
        else
            print_error "Failed to install frontend dependencies"
            popd >/dev/null
            exit 1
        fi
        popd >/dev/null
    else
        print_success "Frontend dependencies already installed"
    fi

    # Backend dependencies
    if [ ! -d "server/node_modules" ]; then
        print_info "Installing backend dependencies..."
        cd server
        npm install --silent
        if [ $? -eq 0 ]; then
            print_success "Backend dependencies installed"
        else
            print_error "Failed to install backend dependencies"
            cd ..
            exit 1
        fi
        cd ..
    else
        print_success "Backend dependencies already installed"
    fi
}

# Function to setup Prisma database
setup_prisma() {
    if [ -f "server/prisma/schema.prisma" ]; then
        print_step "Setting up Prisma database..."
        cd server

        # Generate Prisma client if needed
        if [ ! -d "node_modules/@prisma/client" ] || [ ! -f "node_modules/@prisma/client/index.js" ]; then
            print_info "Generating Prisma client..."
            npx prisma generate --silent
        fi

        # Push database schema if database doesn't exist
        if [ ! -f "prisma/dev.db" ]; then
            print_info "Creating database..."
            npx prisma db push --accept-data-loss --silent
        fi

        cd ..
        print_success "Prisma database ready"
    fi
}

# Function to build backend
build_backend() {
    if [ ! -f "server/dist/app.js" ]; then
        print_step "Building backend..."
        cd server

        # Check if TypeScript source files exist
        if [ ! -f "src/app.ts" ]; then
            print_warning "Backend source files not found, skipping build"
            cd ..
            return 0
        fi

        npm run build --silent
        if [ $? -eq 0 ]; then
            print_success "Backend built successfully"
        else
            print_error "Failed to build backend"
            print_info "Will try to start in development mode instead"
            cd ..
            return 1
        fi
        cd ..
    else
        print_success "Backend already built"
    fi
    return 0
}

# Function to start backend with macOS-specific features
start_backend() {
    print_step "Starting backend server..."

    kill_port 3001

    cd server

    # Check if we have built files or source files
    if [ -f "dist/app.js" ]; then
        print_info "Starting built backend..."
        npm start > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        print_success "Backend started in production mode (PID: $BACKEND_PID)"
    elif [ -f "src/app.ts" ]; then
        print_info "Starting backend in development mode..."
        npm run dev > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        print_success "Backend started in dev mode (PID: $BACKEND_PID)"
    else
        print_warning "No backend found to start"
        cd ..
        return 1
    fi

    cd ..

    # Wait and verify
    sleep 5
    if check_port 3001; then
        print_success "Backend is running at http://localhost:3001"
    else
        print_warning "Backend may not have started properly. Check logs/backend.log"
        print_info "You can view backend logs with: tail -f logs/backend.log"
    fi
    return 0
}

# Function to start frontend
start_frontend() {
    print_step "Starting frontend development server from $FRONTEND_NAME..."

    kill_port 5173

    # Create logs directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/logs"

    # Start frontend with logging
    pushd "$FRONTEND_DIR" >/dev/null
    npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    popd >/dev/null
    print_success "Frontend started (PID: $FRONTEND_PID)"

    # Wait and verify
    sleep 3
    if check_port 5173; then
        print_success "Frontend is running at http://localhost:5173"
    else
        print_warning "Frontend may not have started properly. Check logs/frontend.log"
    fi
}

# Function to open in browser with macOS-specific options
open_browser() {
    if [ "$1" != "--no-browser" ]; then
        print_step "Opening Portfolio Forge in your default browser..."
        sleep 2
        open http://localhost:5173

        # Optional: Open in specific browsers
        # open -a "Google Chrome" http://localhost:5173
        # open -a "Safari" http://localhost:5173
        # open -a "Firefox" http://localhost:5173
    fi
}

# Function to show macOS-styled status
show_status() {
    clear
    echo ""
    print_header "${ROCKET} Portfolio Forge is Running!"
    echo ""
    echo -e "${WHITE}Services:${NC}"
    echo -e "  ${CYAN}Frontend:${NC} http://localhost:5173"
    echo -e "  ${CYAN}Backend:${NC}  http://localhost:3001"
    echo ""
    echo -e "${WHITE}Process IDs:${NC}"
    echo -e "  ${CYAN}Frontend PID:${NC} $FRONTEND_PID"
    echo -e "  ${CYAN}Backend PID:${NC}  $BACKEND_PID"
    echo ""
    echo -e "${WHITE}Logs:${NC}"
    echo -e "  ${CYAN}Frontend:${NC} logs/frontend.log"
    echo -e "  ${CYAN}Backend:${NC}  logs/backend.log"
    echo ""
    echo -e "${YELLOW}Press ${WHITE}Ctrl+C${YELLOW} to stop all services${NC}"
    echo -e "${YELLOW}Press ${WHITE}Cmd+T${YELLOW} to open a new terminal tab${NC}"
    echo ""
}

# Function to monitor services (macOS-specific)
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

# Function to cleanup with macOS-specific commands
cleanup() {
    echo ""
    print_warning "Shutting down Portfolio Forge..."

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
    kill_port 5173
    kill_port 3001

    print_success "All services stopped cleanly"
    echo ""
    print_info "Thanks for using Portfolio Forge! ${SPARKLES}"
    exit 0
}

# Function to show help
show_help() {
    echo ""
    print_header "${ROCKET} Portfolio Forge - macOS Startup Script"
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
    echo -e "  ${CYAN}Frontend:${NC} React development server (Vite) on port 5173"
    echo -e "  ${CYAN}Backend:${NC}  Express API server on port 3001"
    echo ""
    echo -e "${WHITE}First time setup:${NC}"
    echo -e "  ${CYAN}npm run setup${NC}   Install dependencies and build backend"
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
        # Use macOS-specific multitail if available, otherwise use tail
        if command -v multitail &> /dev/null; then
            multitail logs/frontend.log logs/backend.log
        else
            tail -f logs/frontend.log logs/backend.log
        fi
    else
        print_warning "Log files not found. Start the services first."
    fi
}

# Function to clean install
clean_install() {
    print_warning "Performing clean installation..."
    print_step "Removing node_modules directories..."
    rm -rf "$FRONTEND_DIR/node_modules" node_modules server/node_modules server/dist
    print_success "Cleanup complete"
    install_dependencies
    build_backend
}

# Main execution
main() {
    # Set trap for cleanup
    trap cleanup INT TERM EXIT

    # Check if running on macOS
    check_macos

    # Clear terminal for clean start
    clear

    print_header "${SPARKLES} Portfolio Forge - macOS Edition"

    print_info "Frontend workspace: $FRONTEND_NAME ($FRONTEND_DIR)"

    # Check prerequisites
    check_prerequisites

    # Install dependencies
    install_dependencies

    # Setup Prisma database
    setup_prisma

    # Build backend
    build_backend

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