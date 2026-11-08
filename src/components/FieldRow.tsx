import React, { useState } from 'react';
import { Copy, Check, Lock, Unlock, RefreshCw } from 'lucide-react';
import { LockableFieldKey } from '../types/identity';

interface FieldRowProps {
  label: string;
  value: string;
  fieldKey?: LockableFieldKey;
  isLocked?: boolean;
  onToggleLock?: (fieldKey: LockableFieldKey) => void;
  onReroll?: (fieldKey: LockableFieldKey) => void;
  onCopy: (label: string, value: string) => void;
  mono?: boolean;
  compact?: boolean;
  badge?: string;
}

export const FieldRow: React.FC<FieldRowProps> = ({
  label,
  value,
  fieldKey,
  isLocked = false,
  onToggleLock,
  onReroll,
  onCopy,
  mono = false,
  compact = false,
  badge,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    onCopy(label, value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className={`group relative rounded-lg border transition-all ${
        isLocked
          ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/5 dark:border-amber-500/30'
          : 'bg-slate-50/70 dark:bg-[#131822] border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/40'
      } ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {label}
            </span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {badge}
              </span>
            )}
            {isLocked && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                Pinned
              </span>
            )}
          </div>
          <div
            onClick={handleCopy}
            title="Click to copy"
            className={`mt-0.5 truncate cursor-pointer select-text ${
              compact ? 'text-xs' : 'text-sm'
            } font-medium text-slate-900 dark:text-slate-100 ${mono ? 'font-mono' : ''}`}
          >
            {value || '—'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {fieldKey && onReroll && !isLocked && (
            <button
              type="button"
              onClick={() => onReroll(fieldKey)}
              title={`Reroll ${label}`}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {fieldKey && onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(fieldKey)}
              title={isLocked ? `Unpin ${label}` : `Pin/Lock ${label} when regenerating`}
              className={`p-1.5 rounded-md transition-all ${
                isLocked
                  ? 'text-amber-500 bg-amber-500/10 opacity-100'
                  : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title={`Copy ${label}`}
            className={`p-1.5 rounded-md transition-colors ${
              copied
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
