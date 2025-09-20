#!/bin/bash

# Portfolio Forge - Startup Script
# This script starts both the frontend and backend services

# Resolve project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT"
if [ -f "$PROJECT_ROOT/portfolio-intake/package.json" ]; then
    FRONTEND_DIR="$PROJECT_ROOT/portfolio-intake"
fi
FRONTEND_NAME="$(basename "$FRONTEND_DIR")"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
        print_warning "Killing existing processes on port $port"
        kill -9 $pids 2>/dev/null
        sleep 1
    fi
}

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_status "Node.js version: $(node --version)"
}

# Function to check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_status "npm version: $(npm --version)"
}

# Function to install dependencies
install_dependencies() {
    print_status "Checking and installing dependencies..."

    # Frontend dependencies
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_status "Installing frontend dependencies from $FRONTEND_NAME..."
        pushd "$FRONTEND_DIR" >/dev/null
        npm install
        popd >/dev/null
    else
        print_status "Frontend dependencies already installed for $FRONTEND_NAME"
    fi

    # Backend dependencies
    if [ ! -d "server/node_modules" ]; then
        print_status "Installing backend dependencies..."
        cd server
        npm install
        cd ..
    fi

    print_success "Dependencies are ready"
}

# Function to build the backend
build_backend() {
    print_status "Building backend..."
    cd server

    if npm run build; then
        print_success "Backend built successfully"
    else
        print_error "Failed to build backend"
        cd ..
        exit 1
    fi

    cd ..
}

# Function to start the backend
start_backend() {
    print_status "Starting backend server..."

    # Kill any existing process on port 3001
    kill_port 3001

    cd server

    # Start backend in the background
    if [ -f "dist/app.js" ]; then
        npm start &
        BACKEND_PID=$!
        print_success "Backend server starting on port 3001 (PID: $BACKEND_PID)"
    else
        print_warning "Backend not built, starting in development mode..."
        npm run dev &
        BACKEND_PID=$!
        print_success "Backend server starting in dev mode on port 3001 (PID: $BACKEND_PID)"
    fi

    cd ..

    # Wait a moment for the server to start
    sleep 3

    # Check if backend is running
    if check_port 3001; then
        print_success "Backend server is running on http://localhost:3001"
    else
        print_warning "Backend server may not have started properly"
    fi
}

# Function to start the frontend
start_frontend() {
    print_status "Starting frontend development server from $FRONTEND_NAME..."

    # Kill any existing process on port 5173
    kill_port 5173

    # Start frontend in the background
    pushd "$FRONTEND_DIR" >/dev/null
    npm run dev &
    FRONTEND_PID=$!
    popd >/dev/null
    print_success "Frontend server starting on port 5173 (PID: $FRONTEND_PID)"

    # Wait a moment for the server to start
    sleep 3

    # Check if frontend is running
    if check_port 5173; then
        print_success "Frontend server is running on http://localhost:5173"
    else
        print_warning "Frontend server may not have started properly"
    fi
}

# Function to open the application in browser
open_browser() {
    print_status "Opening application in browser..."
    if command -v open &> /dev/null; then
        # macOS
        open http://localhost:5173
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open http://localhost:5173
    elif command -v start &> /dev/null; then
        # Windows
        start http://localhost:5173
    else
        print_warning "Could not automatically open browser. Please visit http://localhost:5173"
    fi
}

# Function to display running services
show_status() {
    echo ""
    print_header "🚀 Portfolio Forge is running!"
    echo ""
    print_status "Frontend: http://localhost:5173"
    print_status "Backend:  http://localhost:3001"
    echo ""
    print_status "Frontend PID: $FRONTEND_PID"
    print_status "Backend PID:  $BACKEND_PID"
    echo ""
    print_status "Press Ctrl+C to stop all services"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    print_warning "Shutting down services..."

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_status "Frontend server stopped"
    fi

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_status "Backend server stopped"
    fi

    # Kill any remaining processes on our ports
    kill_port 5173
    kill_port 3001

    print_success "All services stopped. Goodbye!"
    exit 0
}

# Main execution
main() {
    # Set trap to cleanup on exit
    trap cleanup INT TERM EXIT

    print_header "🎨 Portfolio Forge Startup Script"
    print_header "=================================="
    echo ""

    print_status "Using frontend workspace: $FRONTEND_NAME ($FRONTEND_DIR)"
    echo ""

    # Check prerequisites
    check_node
    check_npm
    echo ""

    # Install dependencies
    install_dependencies
    echo ""

    # Build backend if needed
    if [ ! -f "server/dist/app.js" ]; then
        build_backend
        echo ""
    fi

    # Start services
    start_backend
    start_frontend

    # Open browser
    if [ "$1" != "--no-browser" ]; then
        open_browser
    fi

    # Show status
    show_status

    # Keep script running
    while true; do
        sleep 1
    done
}

# Parse command line arguments
case "$1" in
    --help|-h)
        echo "Portfolio Forge Startup Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --no-browser    Don't automatically open browser"
        echo "  --help, -h      Show this help message"
        echo ""
        echo "Services:"
        echo "  Frontend: http://localhost:5173"
        echo "  Backend:  http://localhost:3001"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac