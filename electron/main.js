const path = require("path");
const { app, BrowserWindow, shell } = require("electron");

function getAppUrl() {
  const cliArg = process.argv.find((arg) => arg.startsWith("--app-url="));
  if (cliArg) {
    return cliArg.slice("--app-url=".length);
  }

  return process.env.ELECTRON_START_URL || null;
}

function createMainWindow() {
  const appUrl = getAppUrl();
  const window = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    title: "iGlasses Simulator",
    backgroundColor: "#0b0d12",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (appUrl) {
    window.loadURL(appUrl);
  } else {
    window.loadFile(path.join(__dirname, "..", "index.html"));
  }

  window.once("ready-to-show", () => {
    window.show();
  });

  window.webContents.setZoomFactor(1);
  window.webContents.setVisualZoomLevelLimits(1, 1);
  window.webContents.on("before-input-event", (event, input) => {
    const isRefresh = input.key.toLowerCase() === "r" && input.control;
    const isZoomShortcut =
      input.control &&
      (input.key === "+" || input.key === "=" || input.key === "-" || input.key === "0");

    if (isRefresh || isZoomShortcut) {
      event.preventDefault();
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    const allowedUrl = appUrl;
    const isAllowedHttp = allowedUrl && url.startsWith(allowedUrl);
    const isAllowedFile = !allowedUrl && url.startsWith("file://");

    if (!isAllowedHttp && !isAllowedFile) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    console.error("Window failed to load", { errorCode, errorDescription, validatedUrl });
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process exited", details);
  });

  if (!app.isPackaged || process.argv.includes("--devtools")) {
    window.webContents.openDevTools({ mode: "detach" });
  }

  return window;
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

process.on("uncaughtException", (error) => {
  console.error("Main process uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Main process unhandled rejection", reason);
});
