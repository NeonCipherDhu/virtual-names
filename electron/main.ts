import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let isCompactMode = false;
let normalBounds = { width: 1280, height: 840, x: undefined as number | undefined, y: undefined as number | undefined };

// Prevent renderer sandbox crash on newer Windows 11 builds (24H2 / 26xxx)
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.setAppUserModelId('com.virtualnames.privacyapp');

function resolveAppIconPath(): string {
  const candidates = [
    path.join(process.resourcesPath, 'app-icon.ico'),
    path.join(process.resourcesPath, 'app-icon.png'),
    path.join(__dirname, '../dist/app-icon.ico'),
    path.join(__dirname, '../dist/app-icon.png'),
    path.join(__dirname, '../public/app-icon.ico'),
    path.join(__dirname, '../public/app-icon.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

function getVaultFilePath(): string {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'virtual-names-vault.json');
}

function createWindow() {
  const iconPath = resolveAppIconPath();
  const appIcon = nativeImage.createFromPath(iconPath);
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 380,
    minHeight: 520,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#090b10',
    icon: appIcon.isEmpty() ? iconPath : appIcon,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (!appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (process.argv.includes('--dev') ? 'http://localhost:5173' : '');
  const isDev = !app.isPackaged && (devServerUrl || process.env.NODE_ENV !== 'production');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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

// Window Controls IPC
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:set-compact-mode', (_event, enable: boolean) => {
  if (!mainWindow) return false;
  isCompactMode = enable;

  if (enable) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    }
    const b = mainWindow.getBounds();
    normalBounds = { width: b.width, height: b.height, x: b.x, y: b.y };
    mainWindow.setAlwaysOnTop(true, 'floating');
    mainWindow.setSize(430, 740, true);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setSize(normalBounds.width || 1280, normalBounds.height || 840, true);
    if (normalBounds.x !== undefined && normalBounds.y !== undefined) {
      mainWindow.setPosition(normalBounds.x, normalBounds.y, true);
    }
  }
  return isCompactMode;
});

ipcMain.handle('window:set-always-on-top', (_event, enable: boolean) => {
  if (!mainWindow) return false;
  mainWindow.setAlwaysOnTop(enable, 'floating');
  return mainWindow.isAlwaysOnTop();
});

function getDisplayVaultPath(): string {
  return '%APPDATA%\\Virtual Names\\virtual-names-vault.json';
}

// Vault Storage IPC
ipcMain.handle('vault:load', async () => {
  try {
    const filePath = getVaultFilePath();
    const displayPath = getDisplayVaultPath();
    if (!fs.existsSync(filePath)) {
      return { exists: false, data: null, path: displayPath };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { exists: true, data: JSON.parse(raw), path: displayPath };
  } catch (err: any) {
    return { exists: false, data: null, error: err?.message || 'Failed to read vault file' };
  }
});

ipcMain.handle('vault:save', async (_event, payload: unknown) => {
  try {
    const filePath = getVaultFilePath();
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    return { success: true, path: getDisplayVaultPath() };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to write vault file' };
  }
});

ipcMain.handle('vault:export-dialog', async (_event, options: { defaultName: string; content: string; filters: { name: string; extensions: string[] }[] }) => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Virtual Names Vault',
    defaultPath: options.defaultName,
    filters: options.filters,
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  fs.writeFileSync(result.filePath, options.content, 'utf-8');
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('vault:import-dialog', async () => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Virtual Names Backup (JSON)',
    properties: ['openFile'],
    filters: [{ name: 'JSON Vault Backup', extensions: ['json'] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }
  const content = fs.readFileSync(result.filePaths[0], 'utf-8');
  return { canceled: false, content, filePath: result.filePaths[0] };
});

ipcMain.handle('shell:open-vault-folder', async () => {
  const filePath = getVaultFilePath();
  shell.showItemInFolder(filePath);
  return true;
});
