import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  Database,
  CheckCircle2,
  ShieldCheck,
  Globe2,
  Layers,
} from 'lucide-react';
import {
  GeneratedIdentity,
  GeneratorOptions,
  LockableFieldKey,
  LockedFieldsMap,
  VaultStorageFile,
  WebsiteContext,
} from './types/identity';
import { generateIdentity, rerollSingleField } from './utils/generator';
import { platformBridge } from './utils/platformBridge';
import { decryptVaultIdentities, encryptVaultIdentities } from './utils/vaultCrypto';
import { TitleBar } from './components/TitleBar';
import { GeneratorWorkspace } from './components/GeneratorWorkspace';
import { VaultWorkspace } from './components/VaultWorkspace';
import { ConfigurePinModal, UnlockScreen } from './components/VaultLockModals';

const DEFAULT_OPTIONS: GeneratorOptions = {
  countryCode: 'US',
  gender: 'any',
  ageRange: 'any',
  emailDomainPreset: 'privacy-mix',
  customEmailDomain: '',
  passwordLength: 16,
  includeSymbolsInPassword: true,
  usernameStyle: 'realistic',
};

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'generator' | 'vault'>('generator');
  const [compactMode, setCompactMode] = useState(false);

  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
  const [lockedFields, setLockedFields] = useState<LockedFieldsMap>({});
  const [currentIdentity, setCurrentIdentity] = useState<GeneratedIdentity>(() =>
    generateIdentity(DEFAULT_OPTIONS)
  );

  // Vault State
  const [savedIdentities, setSavedIdentities] = useState<GeneratedIdentity[]>([]);
  const [vaultPath, setVaultPath] = useState<string>('%APPDATA%/Virtual Names/virtual-names-vault.json');
  const [rawEncryptedVault, setRawEncryptedVault] = useState<VaultStorageFile | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [showPinConfigModal, setShowPinConfigModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Apply Dark/Light Class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load Vault on Startup
  useEffect(() => {
    (async () => {
      const res = await platformBridge.loadVault();
      setVaultPath(res.path);
      if (res.exists && res.data) {
        if (res.data.settings?.theme) {
          setTheme(res.data.settings.theme);
        }
        if (res.data.encrypted) {
          setRawEncryptedVault(res.data);
          setIsVaultLocked(true);
        } else {
          setSavedIdentities(res.data.identities || []);
        }
      }
    })();
  }, []);

  // Persist Vault Helper
  const persistVault = useCallback(
    async (
      identitiesToSave: GeneratedIdentity[],
      pinToUse: string | null = activePin,
      themeToSave: 'dark' | 'light' = theme
    ) => {
      const settings = {
        theme: themeToSave,
        defaultCountryCode: options.countryCode,
        defaultEmailDomain: options.emailDomainPreset,
      };

      if (pinToUse) {
        const encryptedPayload = await encryptVaultIdentities(
          identitiesToSave,
          pinToUse,
          settings
        );
        setRawEncryptedVault(encryptedPayload);
        await platformBridge.saveVault(encryptedPayload);
      } else {
        const plainPayload: VaultStorageFile = {
          version: 1,
          encrypted: false,
          identities: identitiesToSave,
          settings,
        };
        setRawEncryptedVault(null);
        await platformBridge.saveVault(plainPayload);
      }
    },
    [activePin, theme, options.countryCode, options.emailDomainPreset]
  );

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (!isVaultLocked) {
      persistVault(savedIdentities, activePin, next);
    }
  };

  const handleToggleCompactMode = async () => {
    const next = !compactMode;
    await platformBridge.setCompactMode(next);
    setCompactMode(next);
    if (next) {
      setActiveTab('generator');
    }
  };

  const handleUpdateOptions = (partial: Partial<GeneratorOptions>) => {
    setOptions((prev) => ({ ...prev, ...partial }));
  };

  const handleGenerateNew = (overrideOptions?: Partial<GeneratorOptions>) => {
    const mergedOptions = { ...options, ...(overrideOptions || {}) };
    const nextIdentity = generateIdentity(
      mergedOptions,
      currentIdentity,
      lockedFields,
      currentIdentity.website
    );
    // Give it a fresh ID if not editing an existing one
    nextIdentity.id = `id_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
    setCurrentIdentity(nextIdentity);
  };

  const handleRerollField = (field: LockableFieldKey) => {
    const updated = rerollSingleField(currentIdentity, field, options);
    setCurrentIdentity(updated);
    triggerToast(`Rerolled ${field}`);
  };

  const handleToggleLock = (field: LockableFieldKey) => {
    setLockedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleClearAllLocks = () => {
    setLockedFields({});
    triggerToast('Unpinned all fields');
  };

  const handleSelectAltUsername = (username: string) => {
    setCurrentIdentity((prev) => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        username,
        email: lockedFields.email
          ? prev.credentials.email
          : `${username}@${prev.credentials.emailDomain}`,
      },
    }));
    triggerToast(`Switched handle to @${username}`);
  };

  const handleUpdateWebsiteContext = (partial: Partial<WebsiteContext>) => {
    setCurrentIdentity((prev) => ({
      ...prev,
      website: {
        ...prev.website,
        ...partial,
      },
    }));
  };

  const handleSaveToVault = async () => {
    if (isVaultLocked) {
      setActiveTab('vault');
      triggerToast('Unlock your vault first to save identities');
      return;
    }

    const existsIdx = savedIdentities.findIndex((i) => i.id === currentIdentity.id);
    let updatedList: GeneratedIdentity[];
    if (existsIdx >= 0) {
      const clone = { ...currentIdentity, id: `id_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}` };
      updatedList = [clone, ...savedIdentities];
      setCurrentIdentity(clone);
    } else {
      updatedList = [currentIdentity, ...savedIdentities];
    }

    setSavedIdentities(updatedList);
    await persistVault(updatedList);
    triggerToast(
      `Saved "${currentIdentity.core.fullName}" (${
        currentIdentity.website.websiteName || 'No site name'
      }) to Vault`
    );
  };

  const handleUpdateSavedIdentity = async (updated: GeneratedIdentity) => {
    const next = savedIdentities.map((item) => (item.id === updated.id ? updated : item));
    setSavedIdentities(next);
    await persistVault(next);
  };

  const handleDeleteSavedIdentity = async (id: string) => {
    const next = savedIdentities.filter((item) => item.id !== id);
    setSavedIdentities(next);
    await persistVault(next);
    triggerToast('Identity removed from Vault');
  };

  const handleImportIdentities = async (imported: GeneratedIdentity[]) => {
    const existingIds = new Set(savedIdentities.map((i) => i.id));
    const fresh = imported.filter((i) => i && i.id && !existingIds.has(i.id));
    const merged = [...fresh, ...savedIdentities];
    setSavedIdentities(merged);
    await persistVault(merged);
    triggerToast(`Imported ${fresh.length} identities into Vault`);
  };

  const handleLoadIntoGenerator = (identity: GeneratedIdentity) => {
    setCurrentIdentity(identity);
    setOptions((prev) => ({ ...prev, countryCode: identity.core.countryCode }));
    setActiveTab('generator');
    triggerToast(`Loaded ${identity.core.fullName} into Generator`);
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    triggerToast(`Copied ${label} to clipboard`);
  };

  const handleUnlockVault = async (pinInput: string): Promise<boolean> => {
    if (!rawEncryptedVault) return false;
    const decrypted = await decryptVaultIdentities(rawEncryptedVault, pinInput);
    setSavedIdentities(decrypted);
    setActivePin(pinInput);
    setIsVaultLocked(false);
    triggerToast('Vault unlocked');
    return true;
  };

  const handleSavePinConfig = async (newPin: string | null) => {
    setActivePin(newPin);
    await persistVault(savedIdentities, newPin);
    triggerToast(
      newPin
        ? 'Vault encrypted with Master PIN (AES-256-GCM)'
        : 'Vault encryption PIN removed'
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100/80 dark:bg-[#090b10] text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Custom Windows Frameless TitleBar */}
      <TitleBar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        compactMode={compactMode}
        onToggleCompactMode={handleToggleCompactMode}
        isVaultLocked={isVaultLocked}
        hasPinConfigured={Boolean(activePin || rawEncryptedVault?.encrypted)}
        onLockVaultNow={() => {
          if (activePin || rawEncryptedVault?.encrypted) {
            setIsVaultLocked(true);
            triggerToast('Vault locked');
          }
        }}
        savedCount={savedIdentities.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar (Hidden in Compact Floating Mode) */}
        {!compactMode && (
          <aside className="w-60 bg-white dark:bg-[#0d1017] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-3.5 shrink-0">
            <div className="space-y-1.5">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('generator')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'generator'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Persona Generator</span>
                </div>
                <span className="text-xs">{currentIdentity.core.flag}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'vault'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4" />
                  <span>Saved Identity Vault</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {savedIdentities.length}
                </span>
              </button>
            </div>

            {/* Bottom Info Card */}
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200/80 dark:border-slate-800/80 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Globe2 className="w-4 h-4 text-emerald-500" />
                  <span>18 Global Demographics</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Names, phone codes, postal codes, streets, and cities match the selected country's demographic profile.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleCompactMode}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800/90 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Launch Floating Companion</span>
              </button>

              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  100% Offline Local
                </span>
                <span>v1.0.0</span>
              </div>
            </div>
          </aside>
        )}

        {/* Active View */}
        {activeTab === 'generator' || compactMode ? (
          <GeneratorWorkspace
            identity={currentIdentity}
            options={options}
            lockedFields={lockedFields}
            compactMode={compactMode}
            onUpdateOptions={handleUpdateOptions}
            onGenerateNew={handleGenerateNew}
            onRerollField={handleRerollField}
            onToggleLock={handleToggleLock}
            onClearAllLocks={handleClearAllLocks}
            onSelectAltUsername={handleSelectAltUsername}
            onUpdateWebsiteContext={handleUpdateWebsiteContext}
            onSaveToVault={handleSaveToVault}
            onCopy={handleCopy}
          />
        ) : isVaultLocked ? (
          <UnlockScreen onUnlock={handleUnlockVault} />
        ) : (
          <VaultWorkspace
            identities={savedIdentities}
            vaultPath={vaultPath}
            hasPinConfigured={Boolean(activePin || rawEncryptedVault?.encrypted)}
            onUpdateIdentity={handleUpdateSavedIdentity}
            onDeleteIdentity={handleDeleteSavedIdentity}
            onImportIdentities={handleImportIdentities}
            onLoadIntoGenerator={handleLoadIntoGenerator}
            onConfigurePinModal={() => setShowPinConfigModal(true)}
            onCopy={handleCopy}
          />
        )}
      </div>

      {/* Configure PIN Modal */}
      {showPinConfigModal && (
        <ConfigurePinModal
          hasPinConfigured={Boolean(activePin || rawEncryptedVault?.encrypted)}
          onSavePin={handleSavePinConfig}
          onClose={() => setShowPinConfigModal(false)}
        />
      )}

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-950 text-white border border-emerald-500/40 shadow-lg text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export default App;
