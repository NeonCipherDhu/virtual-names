import { VaultStorageFile } from '../types/identity';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      setCompactMode: (enable: boolean) => Promise<boolean>;
      setAlwaysOnTop: (enable: boolean) => Promise<boolean>;
      loadVault: () => Promise<{ exists: boolean; data: VaultStorageFile | null; path?: string; error?: string }>;
      saveVault: (payload: VaultStorageFile) => Promise<{ success: boolean; path?: string; error?: string }>;
      exportDialog: (options: {
        defaultName: string;
        content: string;
        filters: { name: string; extensions: string[] }[];
      }) => Promise<{ canceled: boolean; filePath?: string }>;
      importDialog: () => Promise<{ canceled: boolean; content?: string; filePath?: string }>;
      openVaultFolder: () => Promise<boolean>;
    };
  }
}

const LOCAL_STORAGE_KEY = 'virtual_names_vault_v1';

export const platformBridge = {
  isElectron(): boolean {
    return Boolean(window.electronAPI?.isElectron);
  },

  async minimize(): Promise<void> {
    if (window.electronAPI) await window.electronAPI.minimizeWindow();
  },

  async maximize(): Promise<boolean> {
    if (window.electronAPI) return window.electronAPI.maximizeWindow();
    return false;
  },

  async close(): Promise<void> {
    if (window.electronAPI) await window.electronAPI.closeWindow();
  },

  async setCompactMode(enable: boolean): Promise<boolean> {
    if (window.electronAPI) return window.electronAPI.setCompactMode(enable);
    return enable;
  },

  async loadVault(): Promise<{ exists: boolean; data: VaultStorageFile | null; path: string }> {
    if (window.electronAPI) {
      const res = await window.electronAPI.loadVault();
      return {
        exists: res.exists,
        data: res.data,
        path: res.path || '%APPDATA%/Virtual Names/virtual-names-vault.json',
      };
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return { exists: false, data: null, path: 'LocalStorage (Browser Fallback)' };
    }
    try {
      return { exists: true, data: JSON.parse(raw), path: 'LocalStorage (Browser Fallback)' };
    } catch {
      return { exists: false, data: null, path: 'LocalStorage (Browser Fallback)' };
    }
  },

  async saveVault(payload: VaultStorageFile): Promise<boolean> {
    if (window.electronAPI) {
      const res = await window.electronAPI.saveVault(payload);
      return res.success;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    return true;
  },

  async exportFile(
    defaultName: string,
    content: string,
    filters: { name: string; extensions: string[] }[]
  ): Promise<boolean> {
    if (window.electronAPI) {
      const res = await window.electronAPI.exportDialog({ defaultName, content, filters });
      return !res.canceled;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  async importJsonFile(): Promise<string | null> {
    if (window.electronAPI) {
      const res = await window.electronAPI.importDialog();
      if (res.canceled || !res.content) return null;
      return res.content;
    }
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsText(file);
      };
      input.click();
    });
  },

  async openVaultFolder(): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.openVaultFolder();
    }
  },
};
