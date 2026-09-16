const { app, BrowserWindow, ipcMain, screen, desktopCapturer, Menu, Tray, nativeImage, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const { startAuthCallbackServer } = require("./authCallbackServer");

let mainWindow;
let floatingWidget;
let tray = null;
let backendProcess = null;
let screenshotInterval = null;
let currentSessionFolder = null;
let sessionStartTime = null;
let activeProjectData = null;
let activeAuthSession = null;

const IS_DEV = !app.isPackaged;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8081";
const SCREENSHOT_INTERVAL_MS = 30 * 1000; // 30 seconds

// Production Server for Frontend (Dependency-free)
function startProductionServer() {
  const http = require('http');
  const path = require('path');
  const fs = require('fs');
  
  const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'frontend-dist', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(path.join(__dirname, 'frontend-dist'))) {
       res.statusCode = 403;
       res.end('Forbidden');
       return;
    }

    const extname = path.extname(filePath);
    const contentTypeMap = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
    };
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code == 'ENOENT') {
          // If file not found, serve index.html (important for SPA routing)
          fs.readFile(path.join(__dirname, 'frontend-dist', 'index.html'), (err, indexContent) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentTypeMap[extname] || 'application/octet-stream' });
        res.end(content, 'utf-8');
      }
    });
  });

  server.listen(8081, 'localhost', () => {
    console.log('[DevOS] Production frontend server active on http://localhost:8081');
  });
}

function getAppIcon() {
  const iconPath = path.join(__dirname, "assets", "icon.png");
  if (!fs.existsSync(iconPath)) return undefined;
  return nativeImage.createFromPath(iconPath);
}

function createMainWindow() {
  const appIcon = getAppIcon();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0C0C0D',
    titleBarStyle: 'hiddenInset',
    frame: true,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.setTitle('DevOS');

  // In Production, we serve from the local server we started
  mainWindow.loadURL(FRONTEND_URL).catch(err => {
    console.error("Failed to load URL:", err);
  });

  if (IS_DEV) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && ((input.control && input.key.toLowerCase() === 'r') || input.key === 'F5')) {
      mainWindow.reload();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (floatingWidget && !floatingWidget.isDestroyed()) {
      floatingWidget.close();
    }
    app.quit();
  });
}

function createFloatingWidget() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  floatingWidget = new BrowserWindow({
    width: 240,
    height: 80, // Slightly increased for the new header
    x: width - 260,
    y: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  floatingWidget.loadFile(path.join(__dirname, "widget.html"));
}

// ——— Session Management ———

function createSessionFolder() {
  const sessionId = `session-${Date.now()}`;
  const folder = path.join(os.tmpdir(), "devos-sessions", sessionId);
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

async function captureScreenshot() {
  if (!currentSessionFolder) return;
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1280, height: 720 },
    });

    const source = sources[0];
    if (source) {
      const thumbnail = source.thumbnail.toPNG();
      const fileName = `${Date.now()}.png`;
      const filePath = path.join(currentSessionFolder, fileName);
      fs.writeFileSync(filePath, thumbnail);
      
      if (floatingWidget && !floatingWidget.isDestroyed()) {
        const count = fs.readdirSync(currentSessionFolder).filter(f => f.endsWith(".png")).length;
        floatingWidget.webContents.send("screenshot-taken", count);
      }
    }
  } catch (err) {
    console.error("[DevOS] Screenshot failed:", err.message);
  }
}

// SMART screenshot selection — always gives perfect logs
function selectBestScreenshots(folder) {
  const files = fs.readdirSync(folder)
    .filter(f => f.endsWith(".png"))
    .map(f => {
      const filePath = path.join(folder, f);
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        size: stats.size,
        time: stats.mtimeMs,
        name: f
      };
    })
    .sort((a, b) => a.time - b.time); // Sort chronologically

  if (files.length === 0) return [];
  if (files.length <= 8) return files.map(f => f.path); // Use ALL if 8 or fewer

  // Smart selection: always include first, last, and evenly distributed middle
  const selected = [];
  
  // Always include first screenshot (what you started with)
  selected.push(files[0]);
  
  // Always include last screenshot (where you ended up)
  const last = files[files.length - 1];
  
  // Pick 6 evenly distributed screenshots from the middle
  const middle = files.slice(1, -1);
  const step = middle.length / 6;
  for (let i = 0; i < 6; i++) {
    const idx = Math.min(Math.floor(i * step), middle.length - 1);
    const candidate = middle[idx];
    
    // Only add if not too similar to last added (size differs by >3%)
    const prev = selected[selected.length - 1];
    const diff = Math.abs(candidate.size - prev.size) / Math.max(prev.size, 1);
    if (diff > 0.03) {
      selected.push(candidate);
    }
  }
  
  // Always add last
  selected.push(last);
  
  // Remove duplicates by path
  const unique = selected.filter((f, i, arr) => arr.findIndex(x => x.path === f.path) === i);
  
  console.log(`Selected ${unique.length} screenshots from ${files.length} total`);
  return unique.map(f => f.path);
}

function cleanupSession(folder) {
  try {
    fs.rmSync(folder, { recursive: true, force: true });
  } catch (err) {
    console.error("[DevOS] Cleanup failed:", err.message);
  }
}

// ——— IPC Handlers ———

function cleanupAuthSession() {
  if (activeAuthSession?.cleanup) {
    activeAuthSession.cleanup();
  }
  activeAuthSession = null;
}

ipcMain.handle("electron-auth:start-callback-server", async () => {
  cleanupAuthSession();
  activeAuthSession = await startAuthCallbackServer();
  return { callbackUrl: activeAuthSession.callbackUrl };
});

ipcMain.handle("electron-auth:open-external", async (_event, url) => {
  if (!url || typeof url !== "string") {
    throw new Error("A valid OAuth URL is required.");
  }

  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP(S) OAuth URLs can be opened.");
  }

  await shell.openExternal(url);
  return { opened: true };
});

ipcMain.handle("electron-auth:wait-callback", async () => {
  if (!activeAuthSession?.waitForCallback) {
    throw new Error("No authentication session is active.");
  }

  try {
    const callbackUrl = await activeAuthSession.waitForCallback();
    return { callbackUrl };
  } finally {
    cleanupAuthSession();
  }
});

ipcMain.handle("electron-auth:cancel", async () => {
  cleanupAuthSession();
  return { cancelled: true };
});

ipcMain.on("set-active-project", (event, data) => {
  activeProjectData = data;
});

ipcMain.on("start-session", () => {
  currentSessionFolder = createSessionFolder();
  sessionStartTime = Date.now();
  captureScreenshot();
  screenshotInterval = setInterval(captureScreenshot, SCREENSHOT_INTERVAL_MS);
  
  if (floatingWidget && !floatingWidget.isDestroyed()) {
    floatingWidget.webContents.send("session-started", { startTime: sessionStartTime });
  }
});

ipcMain.handle("end-session", async () => {
  if (!currentSessionFolder) return null;
  
  clearInterval(screenshotInterval);
  screenshotInterval = null;
  
  // Take one final screenshot before ending
  await captureScreenshot();
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for file to write
  
  const sessionDuration = Math.round((Date.now() - sessionStartTime) / 60000);
  const folder = currentSessionFolder;
  currentSessionFolder = null;
  sessionStartTime = null;
  
  const allFiles = fs.readdirSync(folder).filter(f => f.endsWith(".png"));
  if (allFiles.length === 0) {
    cleanupSession(folder);
    return { error: "No screenshots captured" };
  }
  
  const selected = selectBestScreenshots(folder);
  const images = selected
    .filter(f => fs.existsSync(f))
    .map(f => ({
      base64: fs.readFileSync(f).toString("base64"),
      mimeType: "image/png"
    }));
  
  cleanupSession(folder);
  
  const result = {
    images,
    duration: sessionDuration,
    totalScreenshots: allFiles.length,
    selectedScreenshots: images.length
  };

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("session-ended-data", result);
  }
  if (floatingWidget && !floatingWidget.isDestroyed()) {
    floatingWidget.webContents.send("session-ended");
  }

  return result;
});

ipcMain.on("open-main-window", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
});

ipcMain.on("close-widget", () => {
  if (floatingWidget && !floatingWidget.isDestroyed()) {
    floatingWidget.hide();
  }
});

ipcMain.on("move-window", (event, { x, y }) => {
  if (floatingWidget && !floatingWidget.isDestroyed()) {
    const { x: curX, y: curY } = floatingWidget.getBounds();
    floatingWidget.setBounds({ x: curX + x, y: curY + y, width: 240, height: 80 });
  }
});

function startBackend() {
  if (!IS_DEV) {
    console.log("[DevOS] Production mode: Backend will not be started locally.");
    return;
  }

  const backendDir = path.join(__dirname, "../backend");
  const serverPath = path.join(backendDir, "server.js");

  if (!fs.existsSync(serverPath)) {
    console.error(`[DevOS] Backend server.js not found at: ${serverPath}`);
    return;
  }

  console.log(`[DevOS] Starting backend from: ${serverPath}`);

  backendProcess = spawn(app.getPath('exe'), [serverPath], {
    cwd: backendDir,
    env: { 
      ...process.env, 
      NODE_ENV: "development",
      ELECTRON_RUN_AS_NODE: "1" 
    },
    shell: false
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend Error] ${data}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`[Backend] Process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  
  if (!IS_DEV) {
    startProductionServer();
  } else {
    startBackend();
  }

  createMainWindow();
  createFloatingWidget();
  
  // Tray icon to reopen widget
  const iconPath = path.join(__dirname, "assets/icon.png");
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip("DevOS");
    tray.on("click", () => {
      if (floatingWidget && !floatingWidget.isDestroyed()) {
        floatingWidget.show();
      } else {
        createFloatingWidget();
      }
    });
  }
});

app.on("window-all-closed", () => {
  cleanupAuthSession();
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
