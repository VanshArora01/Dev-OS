const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Desktop OAuth (system browser + loopback callback)
  startOAuthCallback: () => ipcRenderer.invoke("electron-auth:start-callback-server"),
  openExternal: (url) => ipcRenderer.invoke("electron-auth:open-external", url),
  waitForOAuthCallback: () => ipcRenderer.invoke("electron-auth:wait-callback"),
  cancelOAuth: () => ipcRenderer.invoke("electron-auth:cancel"),

  // Session control
  startSession: () => ipcRenderer.send("start-session"),
  endSession: () => ipcRenderer.invoke("end-session"),
  
  // Project context
  setActiveProject: (data) => ipcRenderer.send("set-active-project", data),
  
  // Window management
  openMainWindow: () => ipcRenderer.send("open-main-window"),
  moveWindow: (offset) => ipcRenderer.send("move-window", offset),
  closeWidget: () => ipcRenderer.send("close-widget"),
  
  // Listeners
  onSessionStarted: (callback) => {
    ipcRenderer.removeAllListeners("session-started");
    ipcRenderer.on("session-started", (event, data) => callback(data));
  },
  onSessionEnded: (callback) => {
    ipcRenderer.removeAllListeners("session-ended");
    ipcRenderer.on("session-ended", () => callback());
  },
  onScreenshotTaken: (callback) => {
    ipcRenderer.on("screenshot-taken", (event, count) => callback(count));
  },
  onEndSession: (callback) => {
    ipcRenderer.removeAllListeners("session-ended-data");
    ipcRenderer.on("session-ended-data", (event, data) => callback(data));
  },
});
