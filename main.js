const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
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
    title: 'PRO Billing Software',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
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

  // Native Right-Click Context Menu for Inputs & Textareas (Cut, Copy, Paste, Undo, Select All)
  mainWindow.webContents.on('context-menu', (e, params) => {
    if (params.isEditable) {
      const editMenu = Menu.buildFromTemplate([
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]);
      editMenu.popup({ window: mainWindow });
    }
  });

  // Load the React build file
  mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));

  // DevTools hidden in production
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC handler to generate and save pixel-perfect vector styled invoice PDF
ipcMain.handle('save-invoice-pdf', async (event, { html, filename, layout }) => {
  let printWin = null;
  let tempHtmlPath = null;
  try {
    let windowWidth = 794; // Exact A4 width at 96 DPI (210mm)
    let windowHeight = 1123; // Exact A4 height at 96 DPI (297mm)
    if (layout === 'A5') {
      windowWidth = 559;
      windowHeight = 794;
    } else if (layout === 'thermal' || layout === 'THERMAL') {
      windowWidth = 302;
      windowHeight = 1000;
    }

    printWin = new BrowserWindow({
      show: false,
      width: windowWidth,
      height: windowHeight,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    tempHtmlPath = path.join(os.tmpdir(), `temp_invoice_${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, html, 'utf-8');
    await printWin.loadFile(tempHtmlPath);

    // Give Chromium 600ms to calculate layout, styles, SVG and webfonts
    await new Promise((res) => setTimeout(res, 600));

    let pdfOptions = {
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: 'none' }, // Use CSS page margins only
    };

    if (layout === 'A5') {
      pdfOptions.pageSize = 'A5';
      pdfOptions.landscape = false;
    } else if (layout === 'thermal' || layout === 'THERMAL') {
      pdfOptions.pageSize = {
        width: 80000, // 80mm
        height: 297000
      };
    } else {
      pdfOptions.pageSize = 'A4';
      pdfOptions.landscape = false;
    }

    const pdfBuffer = await printWin.webContents.printToPDF(pdfOptions);
    printWin.close();
    printWin = null;

    try {
      if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    } catch (e) {}

    const safeFilename = (filename || 'Invoice').replace(/[/\\?%*:|"<>]/g, '_') + '.pdf';
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Invoice PDF',
      defaultPath: path.join(app.getPath('downloads'), safeFilename),
      filters: [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]
    });

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, pdfBuffer);
      return { success: true, filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    if (printWin) {
      try { printWin.close(); } catch (e) {}
    }
    if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
      try { fs.unlinkSync(tempHtmlPath); } catch (e) {}
    }
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  startBackend();
  // Wait a little bit for backend to start before showing the window
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});


