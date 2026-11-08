import React from 'react';
import {
  Shield,
  Sun,
  Moon,
  Minimize2,
  Maximize2,
  X,
  Minus,
  Layers,
  Lock,
} from 'lucide-react';
import { platformBridge } from '../utils/platformBridge';

interface TitleBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  compactMode: boolean;
  onToggleCompactMode: () => void;
  isVaultLocked: boolean;
  hasPinConfigured: boolean;
  onLockVaultNow: () => void;
  savedCount: number;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  theme,
  onToggleTheme,
  compactMode,
  onToggleCompactMode,
  isVaultLocked,
  hasPinConfigured,
  onLockVaultNow,
  savedCount,
}) => {
  return (
    <header className="h-11 bg-white/90 dark:bg-[#0d1017] border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between px-3 select-none app-drag-region shrink-0 z-30">
      {/* Left Brand */}
      <div className="flex items-center gap-2.5">
        <img
          src="./app-icon.png"
          alt="Virtual Names Icon"
          className="w-7 h-7 rounded-lg shadow-sm shadow-emerald-500/20 object-contain select-none pointer-events-none"
        />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">
            Virtual Names
          </span>
          {!compactMode && (
            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Identity Shield
            </span>
          )}
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-1 app-no-drag">
        {!compactMode && (
          <div className="hidden sm:flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
            <span>Vault:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">{savedCount}</span>
          </div>
        )}

        {hasPinConfigured && !isVaultLocked && (
          <button
            onClick={onLockVaultNow}
            title="Lock Vault Now"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            {!compactMode && <span>Lock</span>}
          </button>
        )}

        <button
          onClick={onToggleCompactMode}
          title={
            compactMode
              ? 'Exit Compact Always-on-Top Mode'
              : 'Switch to Compact Always-on-Top Floating Mode (for filling forms)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            compactMode
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{compactMode ? 'Full View' : 'Mini Floating Mode'}</span>
        </button>

        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Clean Light Mode' : 'Switch to Stealth Dark Mode'}
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={() => platformBridge.minimize()}
          title="Minimize"
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        {!compactMode && (
          <button
            onClick={() => platformBridge.maximize()}
            title="Maximize / Restore"
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => platformBridge.close()}
          title="Close"
          className="p-1.5 rounded-md text-slate-500 hover:bg-rose-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
