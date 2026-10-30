const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

app.setName('Tempo');

function createApplicationMenu(win) {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: 'Tempo',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('app-undo');
            }
          },
        },
        {
          label: 'Redo',
          accelerator: isMac ? 'Shift+Cmd+Z' : 'Ctrl+Y',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('app-redo');
            }
          },
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.png');
  
  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(iconPath);
    } catch (_) {
      // ignore
    }
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'Tempo',
    icon: iconPath,
    titleBarStyle: 'hiddenInset', // Sleek native Mac traffic light look
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  createApplicationMenu(win);

  // In production / packaged app, load the built dist/index.html
  const indexPath = path.join(__dirname, '../dist/index.html');
  win.loadFile(indexPath).catch(() => {
    // Fallback if testing against local dev server
    win.loadURL('http://localhost:3000');
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
