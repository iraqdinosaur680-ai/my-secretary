const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow = null;
let serverProcess = null;

function startBackgroundServer() {
  // In development, the dev server is run separately (HMR) on port 3000
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron] Running in development mode. Assuming dev server runs on http://localhost:3000');
    return;
  }

  // In production, execute the compiled Express + WS bundled server that mounts clinic_records_sqlite.db
  const serverPath = path.join(__dirname, '../dist/server.cjs');
  console.log(`[Electron] Starting background SQLite clinical server from: ${serverPath}`);
  
  try {
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, NODE_ENV: 'production', PORT: '3000' }
    });

    serverProcess.on('error', (err) => {
      console.error('[Electron] Background server experienced a boot error:', err);
    });

    serverProcess.on('exit', (code) => {
      console.log(`[Electron] Background server shut down with code ${code}`);
    });
  } catch (error) {
    console.error('[Electron] Error starting background server:', error);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    title: 'My Secretary - Clinical Records',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Give the background server 1.5s to start resolving port 3000 in production, or load immediately in dev
  const startUrl = 'http://localhost:3000';
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(startUrl);
  } else {
    setTimeout(() => {
      mainWindow.loadURL(startUrl).catch(() => {
        // Fallback to loading local index file directly if server binding was blocked
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      });
    }, 1500);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackgroundServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    console.log('[Electron] Terminating clinical database engine sub-processes...');
    serverProcess.kill();
  }
});
