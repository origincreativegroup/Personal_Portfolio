# ✅ Portfolio Forge - Complete Startup System

## 🚀 **READY TO USE** - macOS Startup Scripts

Your Portfolio Forge application now has a professional startup system optimized for macOS!

---

## 🎯 **Quick Start (Just 2 Commands)**

```bash
# First time setup
npm run setup

# Start everything
npm start
```

**That's it!** The app will open in your browser automatically at http://localhost:5173

---

## 🛠️ **What's Included**

### **📁 Startup Files Created:**
- ✅ `start-macos.sh` - Main macOS-optimized startup script
- ✅ `launch-portfolio.sh` - Universal launcher (works from anywhere)
- ✅ `README_MACOS.md` - Complete macOS user guide
- ✅ Updated `package.json` with convenience scripts

### **🎨 Features:**
- 🌈 **Beautiful colored terminal output** with emojis
- 🔄 **Automatic dependency management**
- 🏗️ **Smart backend building** (builds only when needed)
- 🚀 **Dual-mode backend startup** (production/development)
- 📊 **Process monitoring** with health checks
- 📝 **Automatic log file generation**
- 🌐 **Native browser integration**
- 🛡️ **Error handling and recovery**

---

## 📋 **Available Commands**

### **Primary Commands:**
```bash
npm start                    # 🚀 Start everything (recommended)
npm run setup                # 🔧 First-time setup
npm run dev                  # Frontend only
```

### **Advanced Commands:**
```bash
./start-macos.sh             # Direct script execution
./start-macos.sh --help      # Show all options
./start-macos.sh --no-browser # Don't auto-open browser
./start-macos.sh --logs      # View real-time logs
./start-macos.sh --clean     # Clean install and start
```

### **Utility Commands:**
```bash
npm run build:backend        # Build backend only
npm run build:all            # Build everything
npm run install:all          # Install all dependencies
npm run clean                # Nuclear reset
```

---

## 🌐 **Service URLs**

Once running, your application is available at:

- **🎨 Frontend (Portfolio App):** http://localhost:5173
- **⚙️ Backend (API Server):** http://localhost:3001

---

## 📊 **Status Monitoring**

### **Real-time Logs:**
```bash
# View logs during development
tail -f logs/frontend.log     # Frontend logs
tail -f logs/backend.log      # Backend logs
tail -f logs/*.log            # Both logs simultaneously
```

### **Process Monitoring:**
The startup script automatically:
- ✅ Monitors both services
- ✅ Detects crashes and reports them
- ✅ Provides colored status updates
- ✅ Shows process IDs for debugging

---

## 🎯 **What Happens When You Run `npm start`**

1. **🔍 System Check:** Verifies macOS, Node.js, and npm
2. **📦 Dependencies:** Auto-installs if missing
3. **🏗️ Backend Build:** Builds TypeScript to JavaScript (if needed)
4. **🔄 Port Cleanup:** Kills any existing processes on ports 5173 & 3001
5. **🚀 Service Startup:** Starts both frontend and backend
6. **📊 Health Check:** Verifies both services are running
7. **🌐 Browser Launch:** Opens http://localhost:5173
8. **📈 Status Display:** Shows beautiful status dashboard
9. **👀 Monitoring:** Continuously monitors service health

---

## 🎨 **Sample Output**

When you run `npm start`, you'll see:

```
✨ Portfolio Forge - macOS Edition
==================================

ℹ️ Node.js v18.17.0 and npm 9.6.7 are ready
✅ Frontend dependencies already installed
✅ Backend dependencies already installed
✅ Backend already built
⚙️ Starting backend server...
ℹ️ Starting built backend...
✅ Backend started in production mode (PID: 12345)
✅ Backend is running at http://localhost:3001
⚙️ Starting frontend development server...
✅ Frontend started (PID: 12346)
✅ Frontend is running at http://localhost:5173

🚀 Portfolio Forge is Running!
===============================

Services:
  Frontend: http://localhost:5173
  Backend:  http://localhost:3001

Process IDs:
  Frontend PID: 12346
  Backend PID:  12345

Logs:
  Frontend: logs/frontend.log
  Backend:  logs/backend.log

Press Ctrl+C to stop all services
Press Cmd+T to open a new terminal tab
```

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions:**

**Port Already in Use:**
```bash
# The script handles this automatically, but if needed:
lsof -ti:5173 | xargs kill -9    # Kill frontend
lsof -ti:3001 | xargs kill -9    # Kill backend
```

**Backend Won't Start:**
```bash
# Check the logs
tail -f logs/backend.log

# Try a clean rebuild
npm run clean
npm run setup
```

**Dependencies Issues:**
```bash
# Clean install everything
./start-macos.sh --clean
```

**Permission Issues:**
```bash
# Make scripts executable
chmod +x start-macos.sh
chmod +x launch-portfolio.sh
```

---

## 🎯 **Development Workflow**

### **Daily Development:**
```bash
npm start                    # Start everything
# Make your changes - auto-reload works!
# Press Ctrl+C when done
```

### **Frontend-Only Work:**
```bash
npm run dev                  # Just the frontend
```

### **Backend-Only Work:**
```bash
npm run start:backend        # Just the backend
```

### **Production Build:**
```bash
npm run build:all            # Build everything for production
```

---

## 🌟 **Advanced Features**

### **Log Management:**
- ✅ Automatic log file creation in `logs/` directory
- ✅ Separate logs for frontend and backend
- ✅ Built-in log viewer: `./start-macos.sh --logs`

### **Smart Building:**
- ✅ Only builds backend when needed
- ✅ Falls back to development mode if build fails
- ✅ Automatic TypeScript compilation

### **Process Management:**
- ✅ Graceful shutdown with Ctrl+C
- ✅ Automatic cleanup of zombie processes
- ✅ Port conflict resolution

### **macOS Integration:**
- ✅ Native browser opening with `open` command
- ✅ Beautiful terminal colors and emojis
- ✅ Homebrew detection
- ✅ macOS-specific process handling

---

## 💡 **Pro Tips**

1. **Alias for Quick Access:**
   ```bash
   # Add to your ~/.zshrc or ~/.bash_profile
   alias portfolio="cd /path/to/Personal_Portfolio && npm start"
   ```

2. **Multiple Terminal Tabs:**
   - Use `Cmd+T` to open new tabs while services run
   - Keep one tab for the services, another for development

3. **Log Monitoring:**
   ```bash
   # In a separate terminal
   tail -f logs/frontend.log logs/backend.log
   ```

4. **Quick Restart:**
   ```bash
   # Ctrl+C to stop, then
   npm start
   ```

---

## 🎉 **You're All Set!**

Your Portfolio Forge startup system is now complete and ready to use. The application includes:

### **🖥️ Frontend Features:**
- 🏠 **Dashboard:** Beautiful project overview with stats
- ✨ **Create:** Step-by-step project creation wizard
- 🎨 **Editor:** Visual block-based editor with collapsible panels
- ⚙️ **Settings:** Comprehensive preferences and API management

### **🔧 Backend Features:**
- 🤖 **AI Analysis:** OpenAI-powered content analysis
- 📁 **File Processing:** Image and document handling
- 🔌 **RESTful API:** Clean endpoints for all features

---

**🚀 Ready to start building amazing portfolios!**

Run `npm start` and let's go! 🎨✨