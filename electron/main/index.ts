import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { setdbPath, executeQuery, executeMany, executeScript, fetchOne, fetchMany, fetchAll, load_extension, backup, iterdump } = require("sqlite-electron")

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//

process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
//export const dbPath = path.join(process.env.APP_ROOT, 'database/sqlite3.db')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')
const pfad = path.join(process.env.APP_ROOT, 'database/mysqlite3.db')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
       nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
    
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(async () => {
  // Fenster erstellen
  createWindow();

  // ⬇️ Hier wird dein Code automatisch beim Start ausgeführt
  try {
    const result = await setdbPath(pfad, true, true);
    console.log("Automatischer Connect erfolgreich:", result);
  } catch (err) {
    console.error("Fehler beim automatischen Connect:", err);
  }
});

// App schließen, wenn alle Fenster zu sind
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle("connect", async (event, dbPath, isuri, autocommit) => {
  try {
    return await setdbPath(pfad, true, true)
  } catch (error) {
    console.log(error)
    return error
  }
});

ipcMain.handle("executeQuery", async (event, query, value) => {
  try {
    return await executeQuery(query, value);
  } catch (error) {
    return error;
  }
});

ipcMain.handle("fetchone", async (event, query, value) => {
  try {
    return await fetchOne(query, value);
  } catch (error) {
    return error;
  }
});

ipcMain.handle("fetchmany", async (event, query, size, value) => {
  try {
    return await fetchMany(query, size, value);
  } catch (error) {
    return error;
  }
});

ipcMain.handle("fetchall", async (event, query, value) => {
  try {
    return await fetchAll(query, value);
  } catch (error) {
    return error;
  }
});

ipcMain.handle("executeMany", async (event, query, values) => {
  try {
    return await executeMany(query, values);
  } catch (error) {
    return error;
  }
});

ipcMain.handle("executeScript", async (event, scriptpath) => {
  try {
    return await executeScript(scriptpath);
  } catch (error) {
    return error;
  }
});

ipcMain.handle("load_extension", async (event, path) => {
  try {
    return await load_extension(path);
  } catch (error) {
    return error;
  }
});

ipcMain.handle("backup", async (event, target, pages, name, sleep) => {
  try {
    return await backup(target, Number(pages), name, Number(sleep));
  } catch (error) {
    return error;
  }
});

ipcMain.handle("iterdump", async (event, path, filter) => {
  try {
    return await iterdump(path, filter);
  } catch (error) {
    return error;
  }
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
