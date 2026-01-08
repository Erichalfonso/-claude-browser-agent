/**
 * Electron Main Process
 *
 * Handles window creation, IPC, and background tasks
 */

import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import type { AppSettings, SyncSession, SyncResult } from './mls/types';

// Initialize secure storage
const store = new Store<{
  settings: AppSettings;
  syncHistory: SyncSession[];
}>({
  encryptionKey: 'mls-vls-syndicator-secure-key',
  defaults: {
    settings: {
      searchCriteria: {},
      autoSync: false,
      syncIntervalHours: 24,
    },
    syncHistory: [],
  },
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: 'MLS VLS Syndicator',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // Don't show until ready
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Syndicator',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: 'Sync Now',
      click: () => {
        mainWindow?.webContents.send('trigger-sync');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('MLS VLS Syndicator');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

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

app.on('before-quit', () => {
  isQuitting = true;
});

// ============================================
// IPC Handlers
// ============================================

// Get app settings
ipcMain.handle('get-settings', async (): Promise<AppSettings> => {
  return store.get('settings');
});

// Save app settings
ipcMain.handle('save-settings', async (_, settings: AppSettings): Promise<void> => {
  store.set('settings', settings);
});

// Get sync history
ipcMain.handle('get-sync-history', async (): Promise<SyncSession[]> => {
  return store.get('syncHistory');
});

// Add sync session to history
ipcMain.handle('add-sync-session', async (_, session: SyncSession): Promise<void> => {
  const history = store.get('syncHistory');
  history.unshift(session); // Add to beginning
  // Keep only last 100 sessions
  if (history.length > 100) {
    history.pop();
  }
  store.set('syncHistory', history);
});

// Clear sync history
ipcMain.handle('clear-sync-history', async (): Promise<void> => {
  store.set('syncHistory', []);
});

// Select directory (for image temp folder, logs, etc.)
ipcMain.handle('select-directory', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Show notification
ipcMain.handle('show-notification', async (_, title: string, body: string): Promise<void> => {
  const { Notification } = require('electron');
  new Notification({ title, body }).show();
});

// Get app version
ipcMain.handle('get-app-version', async (): Promise<string> => {
  return app.getVersion();
});

// Open external link
ipcMain.handle('open-external', async (_, url: string): Promise<void> => {
  const { shell } = require('electron');
  shell.openExternal(url);
});
