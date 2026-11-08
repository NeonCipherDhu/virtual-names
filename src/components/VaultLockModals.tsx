import React, { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';

interface UnlockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
}

export const UnlockScreen: React.FC<UnlockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError('');
    try {
      const ok = await onUnlock(pin);
      if (!ok) {
        setError('Invalid Master PIN / Password. Please try again.');
      }
    } catch {
      setError('Invalid Master PIN / Password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-xl text-center space-y-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Vault Encrypted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your Master PIN or Password to decrypt your saved identities (AES-256-GCM).
          </p>
        </div>

        <input
          type="password"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN or Password..."
          className="w-full bg-slate-50 dark:bg-[#161c28] text-center text-sm font-mono rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
        />

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
        >
          {loading ? 'Decrypting...' : 'Unlock Vault'}
        </button>
      </form>
    </div>
  );
};

interface ConfigurePinModalProps {
  hasPinConfigured: boolean;
  onSavePin: (newPin: string | null) => Promise<void>;
  onClose: () => void;
}

export const ConfigurePinModal: React.FC<ConfigurePinModalProps> = ({
  hasPinConfigured,
  onSavePin,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN/Password must be at least 4 characters.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    await onSavePin(pin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#11151f] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Vault AES-256 Encryption Lock
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Protect your local saved identities file with PBKDF2 + AES-256-GCM encryption so no one else on this computer can read your saved accounts.
        </p>

        <form onSubmit={handleSet} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              New Master PIN or Password
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="At least 4 characters..."
              className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Confirm PIN or Password
            </label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Re-enter PIN or Password..."
              className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {hasPinConfigured ? (
              <button
                type="button"
                onClick={async () => {
                  await onSavePin(null);
                  onClose();
                }}
                className="text-xs font-semibold text-rose-500 hover:underline"
              >
                Remove PIN Encryption
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Save Encryption PIN
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
