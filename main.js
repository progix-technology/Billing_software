const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('Port 5000 is already active, continuing with running instance.');
  } else {
    console.error('Uncaught Exception:', err);
  }
});

function startBackend() {
  try {
    // Require the server directly instead of spawning a new node process
    require('./backend/server.js');
  } catch (err) {
    if (err.code !== 'EADDRINUSE') {
      dialog.showErrorBox('Backend Error', err.message + '\n' + err.stack);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.maximize();
  mainWindow.show();

  // Load the React build file
  mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));

  // DevTools hidden in production
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  // Wait a little bit for backend to start before showing the window
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

