# 🍎 Portfolio Forge - macOS Quick Start Guide

**Optimized startup experience for macOS users with native features and beautiful terminal output.**

## 🚀 One-Command Startup

```bash
./start-simplified-macos.sh
```

That's it! This single command will:
- ✅ Check your macOS system requirements
- ✅ Install all dependencies automatically
- ✅ Set up the database with Prisma
- ✅ Start both frontend and backend services
- ✅ Open your default browser to the app
- ✅ Provide beautiful colored terminal output
- ✅ Create log files for debugging
- ✅ Handle graceful shutdown with Ctrl+C

## 📋 Prerequisites

- **macOS** (this script is macOS-optimized)
- **Node.js** (v18 or higher) - Install with `brew install node`
- **npm** (comes with Node.js)

> **💡 Tip:** If you have Homebrew, the script will detect and show your version!

## 🎯 First Time Setup

```bash
# Clone the repository (if you haven't already)
git clone <your-repo-url>
cd Personal_Portfolio

# Run the startup script - this installs everything and starts the services
./start-simplified-macos.sh
```

## 🛠️ Available Commands

### Quick Commands
```bash
./start-simplified-macos.sh  # 🚀 Start everything (recommended)
npm run dev                  # Start both services using npm workspaces
npm run dev:frontend         # Start frontend only
npm run dev:backend          # Start backend only
```

### Setup & Build Commands
```bash
./start-simplified-macos.sh --clean  # 🔧 Clean install and start
npm install                          # Install root dependencies only
npm run build                        # Build both frontend and backend
```

### Maintenance Commands
```bash
npm run clean                # 🧹 Remove all node_modules and build files
./start-macos.sh --clean     # Clean install and start
```

## 🎨 macOS-Specific Features

### Beautiful Terminal Output
- 🌈 **Colored output** with emojis for better readability
- ✅ **Status indicators** for each step
- 📊 **Progress tracking** with clear visual feedback

### Smart Process Management
- 🔄 **Automatic port cleanup** - kills existing processes on ports 3000 & 3001
- 🏃‍♂️ **Background processes** managed with macOS-native tools
- 📝 **Log file generation** in `logs/` directory

### Browser Integration
- 🌐 **Auto-opens default browser** to http://localhost:3000
- 🍎 **Uses macOS `open` command** for native browser launching

### Advanced Options
```bash
./start-macos.sh --help           # Show detailed help
./start-macos.sh --no-browser     # Don't auto-open browser
./start-macos.sh --logs           # View real-time logs
./start-macos.sh --clean          # Clean install and start
```

## 🌐 Service URLs

Once running, access your application at:

- **🎨 Frontend (Portfolio App):** http://localhost:3000
- **⚙️ Backend (API Server):** http://localhost:3001

## 📊 Monitoring & Logs

### View Logs in Real-Time
```bash
# Option 1: Use the built-in log viewer
./start-macos.sh --logs

# Option 2: Manual log viewing
tail -f logs/frontend.log     # Frontend logs
tail -f logs/backend.log      # Backend logs

# Option 3: Both logs simultaneously
tail -f logs/*.log
```

### Process Monitoring
The startup script automatically monitors both services and will alert you if either stops unexpectedly.

## 🚨 Troubleshooting

### Port Already in Use
The script automatically handles this, but if you encounter issues:
```bash
# Manual port cleanup
lsof -ti:3000 | xargs kill -9    # Kill frontend
lsof -ti:3001 | xargs kill -9    # Kill backend
```

### Permission Issues
```bash
# Make scripts executable
chmod +x start-macos.sh
chmod +x start.sh
```

### Clean Reset
```bash
# Nuclear option - clean everything and start fresh
npm run clean
npm run setup
npm start
```

### Dependencies Issues
```bash
# Fresh install of all dependencies
./start-macos.sh --clean
```

## 🎯 Development Workflow

### Daily Development
```bash
npm start
# Make your changes - both services auto-reload!
# Press Ctrl+C when done
```

### Frontend-Only Development
```bash
npm run dev
# Perfect for UI/styling work
```

### Backend-Only Development
```bash
npm run start:backend
# Ideal for API development
```

### Check Service Status
```bash
# Check if services are running
lsof -i :3000    # Frontend
lsof -i :3001    # Backend
```

## 🎨 What You Get

### 🖥️ Frontend Features
- **Dashboard:** Beautiful project overview with stats
- **Create:** Step-by-step project creation wizard
- **Editor:** Visual block-based project editor with collapsible panels
- **Settings:** Comprehensive user preferences and API management

### ⚙️ Backend Features
- **AI Analysis:** OpenAI-powered content analysis
- **File Processing:** Image and document handling
- **RESTful API:** Clean endpoints for all frontend features

### 🌟 User Experience
- 🌙 **Dark/Light Mode** with smooth transitions
- 📱 **Responsive Design** that works on all screen sizes
- 🎛️ **Collapsible Panels** for customizable workspace
- 🚀 **Hot Reload** for instant development feedback
- 🛡️ **TypeScript** for bulletproof code
- 🎨 **Modern Design System** with consistent styling

## 💡 Pro Tips for macOS Users

1. **Terminal Setup:** Use iTerm2 for even better colors and features
2. **Multiple Terminals:** Use `Cmd+T` to open new tabs while services run
3. **Spotlight Search:** Use `Cmd+Space` and type "Portfolio Forge" to quickly find the browser tab
4. **Activity Monitor:** Use to monitor CPU/memory usage of Node processes
5. **Console App:** Advanced log viewing with `/Applications/Utilities/Console.app`

## 🔄 Keeping Up to Date

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm run install:all

# Rebuild if needed
npm run build:backend

# Restart
npm start
```

## 🆘 Getting Help

If you encounter any issues:

1. **Check the logs:** `./start-macos.sh --logs`
2. **Try a clean install:** `./start-macos.sh --clean`
3. **Check system requirements:** macOS with Node.js v18+
4. **View detailed help:** `./start-macos.sh --help`

---

**Happy coding with Portfolio Forge on macOS! 🍎✨**

*Designed specifically for macOS developers who want a beautiful, native terminal experience.*