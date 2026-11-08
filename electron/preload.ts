import { contextBridge, ipcRenderer } from 'electron';

const electronApi = {
  isElectron: true,
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  setCompactMode: (enable: boolean) => ipcRenderer.invoke('window:set-compact-mode', enable),
  setAlwaysOnTop: (enable: boolean) => ipcRenderer.invoke('window:set-always-on-top', enable),
  loadVault: () => ipcRenderer.invoke('vault:load'),
  saveVault: (payload: unknown) => ipcRenderer.invoke('vault:save', payload),
  exportDialog: (options: {
    defaultName: string;
    content: string;
    filters: { name: string; extensions: string[] }[];
  }) => ipcRenderer.invoke('vault:export-dialog', options),
  importDialog: () => ipcRenderer.invoke('vault:import-dialog'),
  openVaultFolder: () => ipcRenderer.invoke('shell:open-vault-folder'),
};

contextBridge.exposeInMainWorld('electronAPI', electronApi);
