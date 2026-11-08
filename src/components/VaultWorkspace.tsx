import React, { useMemo, useState } from 'react';
import {
  Search,
  Trash2,
  Copy,
  Download,
  Upload,
  FolderOpen,
  Star,
  Flame,
  CheckCircle2,
  Archive,
  Eye,
  Edit3,
  Globe,
  ShieldAlert,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { COUNTRY_DEMOGRAPHICS } from '../data/demographics';
import {
  GeneratedIdentity,
  IdentityStatus,
  RiskLevel,
  WebsiteCategory,
} from '../types/identity';
import { formatIdentitySummaryText, identitiesToCsv } from '../utils/vaultCrypto';
import { platformBridge } from '../utils/platformBridge';
import { PersonaAvatar } from './PersonaAvatar';
import { FieldRow } from './FieldRow';

interface VaultWorkspaceProps {
  identities: GeneratedIdentity[];
  vaultPath: string;
  hasPinConfigured: boolean;
  onUpdateIdentity: (updated: GeneratedIdentity) => void;
  onDeleteIdentity: (id: string) => void;
  onImportIdentities: (imported: GeneratedIdentity[]) => void;
  onLoadIntoGenerator: (identity: GeneratedIdentity) => void;
  onConfigurePinModal: () => void;
  onCopy: (label: string, value: string) => void;
}

const RISK_BADGES: Record<RiskLevel, { label: string; className: string }> = {
  sketchy: {
    label: 'Sketchy / Untrusted',
    className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  disposable: {
    label: 'Disposable',
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  promo: {
    label: 'Promo / Gated',
    className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  testing: {
    label: 'Testing / QA',
    className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  },
  trusted: {
    label: 'Trusted Alias',
    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
};

export const VaultWorkspace: React.FC<VaultWorkspaceProps> = ({
  identities,
  vaultPath,
  hasPinConfigured,
  onUpdateIdentity,
  onDeleteIdentity,
  onImportIdentities,
  onLoadIntoGenerator,
  onConfigurePinModal,
  onCopy,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [selectedIdentity, setSelectedIdentity] = useState<GeneratedIdentity | null>(null);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const filteredIdentities = useMemo(() => {
    return identities.filter((item) => {
      if (onlyFavorites && !item.favorite) return false;
      if (countryFilter !== 'ALL' && item.core.countryCode !== countryFilter) return false;
      if (riskFilter !== 'ALL' && item.website.riskLevel !== riskFilter) return false;
      if (statusFilter !== 'ALL' && item.website.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          item.core.fullName,
          item.core.countryName,
          item.credentials.username,
          item.credentials.email,
          item.website.websiteName,
          item.website.websiteUrl,
          item.website.notes,
          item.website.category,
          item.location.city,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [identities, searchQuery, countryFilter, riskFilter, statusFilter, onlyFavorites]);

  const handleExportJson = async () => {
    const content = JSON.stringify(identities, null, 2);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const ok = await platformBridge.exportFile(
      `virtual-names-backup-${dateStamp}.json`,
      content,
      [{ name: 'JSON Backup', extensions: ['json'] }]
    );
    if (ok) onCopy('Export Status', 'Vault JSON backup saved');
  };

  const handleExportCsv = async () => {
    const csvContent = identitiesToCsv(identities);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const ok = await platformBridge.exportFile(
      `virtual-names-export-${dateStamp}.csv`,
      csvContent,
      [{ name: 'CSV Spreadsheet', extensions: ['csv'] }]
    );
    if (ok) onCopy('Export Status', 'Vault CSV spreadsheet exported');
  };

  const handleImportJson = async () => {
    const raw = await platformBridge.importJsonFile();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const list: GeneratedIdentity[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.identities)
        ? parsed.identities
        : [];
      if (list.length > 0) {
        onImportIdentities(list);
      }
    } catch {
      alert('Invalid JSON backup file.');
    }
  };

  const toggleFavorite = (item: GeneratedIdentity) => {
    onUpdateIdentity({
      ...item,
      favorite: !item.favorite,
      updatedAt: new Date().toISOString(),
    });
  };

  const cycleStatus = (item: GeneratedIdentity, status: IdentityStatus) => {
    const updated = {
      ...item,
      updatedAt: new Date().toISOString(),
      website: {
        ...item.website,
        status,
      },
    };
    onUpdateIdentity(updated);
    if (selectedIdentity?.id === item.id) {
      setSelectedIdentity(updated);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Vault Header & Actions */}
      <div className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Saved Identity Vault ({identities.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stored locally on your Windows PC •{' '}
              <span className="font-mono text-[11px]">{vaultPath}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onConfigurePinModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                hasPinConfigured
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {hasPinConfigured ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Vault PIN Active</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Set Vault PIN Lock</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleImportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {platformBridge.isElectron() && (
              <button
                type="button"
                onClick={() => platformBridge.openVaultFolder()}
                title="Show Vault File in Windows Explorer"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by website, fake name, username, email, city, or notes..."
              className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#161c28] text-xs font-medium rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700/80"
            >
              <option value="ALL">All Countries</option>
              {COUNTRY_DEMOGRAPHICS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#161c28] text-xs font-medium rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700/80"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="sketchy">Sketchy / Untrusted</option>
              <option value="disposable">Disposable</option>
              <option value="promo">Promo / Gated</option>
              <option value="testing">Testing / QA</option>
              <option value="trusted">Trusted Alias</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#161c28] text-xs font-medium rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700/80"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="burned">Burned / Spammed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              title="Filter Favorites"
              className={`w-full h-full flex items-center justify-center rounded-xl border transition-colors py-2 ${
                onlyFavorites
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                  : 'bg-slate-50 dark:bg-[#161c28] border-slate-200 dark:border-slate-700/80 text-slate-400'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Saved Cards Grid */}
      {filteredIdentities.length === 0 ? (
        <div className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            No matching identities in your local vault
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Generate a fake persona in the Generator tab, assign the website where you are signing up, and click "Save Identity" to store it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredIdentities.map((item) => {
            const riskBadge = RISK_BADGES[item.website.riskLevel] || RISK_BADGES.sketchy;
            const isBurned = item.website.status === 'burned';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition-all flex flex-col justify-between bg-white dark:bg-[#10141d] ${
                  isBurned
                    ? 'border-rose-500/30 opacity-80'
                    : 'border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  {/* Website Banner Top */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.website.websiteName || 'Unassigned Website'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.website.websiteUrl || item.website.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskBadge.className}`}
                      >
                        {riskBadge.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item)}
                        className={`p-1 rounded-md transition-colors ${
                          item.favorite
                            ? 'text-amber-400'
                            : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Persona Identity Summary */}
                  <div className="flex items-center gap-3 mb-3">
                    <PersonaAvatar core={item.core} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.core.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.core.flag} {item.location.city}, {item.core.countryName} • {item.core.age}y
                      </div>
                    </div>
                  </div>

                  {/* Quick Copy Credentials Box */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-[#151b26] p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-sans text-[11px]">User:</span>
                      <button
                        type="button"
                        onClick={() => onCopy('Username', item.credentials.username)}
                        className="text-slate-800 dark:text-slate-200 hover:text-emerald-500 truncate font-medium"
                      >
                        {item.credentials.username}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-sans text-[11px]">Email:</span>
                      <button
                        type="button"
                        onClick={() => onCopy('Email', item.credentials.email)}
                        className="text-slate-800 dark:text-slate-200 hover:text-emerald-500 truncate"
                      >
                        {item.credentials.email}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-sans text-[11px]">Pass:</span>
                      <button
                        type="button"
                        onClick={() => onCopy('Password', item.credentials.password)}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline truncate"
                      >
                        {item.credentials.password}
                      </button>
                    </div>
                  </div>

                  {item.website.notes && (
                    <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                      "{item.website.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => cycleStatus(item, 'active')}
                      title="Mark Active"
                      className={`p-1.5 rounded-lg text-xs ${
                        item.website.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => cycleStatus(item, 'burned')}
                      title="Mark Burned / Compromised (Started receiving spam)"
                      className={`p-1.5 rounded-lg text-xs ${
                        item.website.status === 'burned'
                          ? 'bg-rose-500/15 text-rose-500'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => cycleStatus(item, 'archived')}
                      title="Archive"
                      className={`p-1.5 rounded-lg text-xs ${
                        item.website.status === 'archived'
                          ? 'bg-slate-500/20 text-slate-300'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIdentity(item);
                        setIsEditingModal(false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 hover:text-emerald-500 text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadIntoGenerator(item)}
                      title="Load into Generator / Floating Companion"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
                    >
                      Use
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteIdentity(item.id)}
                      title="Delete from Vault"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Edit Modal */}
      {selectedIdentity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151f] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PersonaAvatar core={selectedIdentity.core} size="sm" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedIdentity.core.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Used on: {selectedIdentity.website.websiteName || 'Unspecified Website'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModal(!isEditingModal)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    isEditingModal
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingModal ? 'Done Editing' : 'Edit Fields'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIdentity(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {isEditingModal ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Website Name</label>
                    <input
                      type="text"
                      value={selectedIdentity.website.websiteName}
                      onChange={(e) => {
                        const updated = {
                          ...selectedIdentity,
                          website: { ...selectedIdentity.website, websiteName: e.target.value },
                        };
                        setSelectedIdentity(updated);
                        onUpdateIdentity(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={selectedIdentity.website.websiteUrl}
                      onChange={(e) => {
                        const updated = {
                          ...selectedIdentity,
                          website: { ...selectedIdentity.website, websiteUrl: e.target.value },
                        };
                        setSelectedIdentity(updated);
                        onUpdateIdentity(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={selectedIdentity.core.fullName}
                      onChange={(e) => {
                        const updated = {
                          ...selectedIdentity,
                          core: { ...selectedIdentity.core, fullName: e.target.value },
                        };
                        setSelectedIdentity(updated);
                        onUpdateIdentity(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      value={selectedIdentity.credentials.username}
                      onChange={(e) => {
                        const updated = {
                          ...selectedIdentity,
                          credentials: { ...selectedIdentity.credentials, username: e.target.value },
                        };
                        setSelectedIdentity(updated);
                        onUpdateIdentity(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email</label>
                    <input
                      type="text"
                      value={selectedIdentity.credentials.email}
                      onChange={(e) => {
                        const updated = {
                          ...selectedIdentity,
                          credentials: { ...selectedIdentity.credentials, email: e.target.value },
                        };
                        setSelectedIdentity(updated);
                        onUpdateIdentity(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Password</label>
                    <input
                      type="text"
                      value={selectedIdentity.credentials.password}
                      onChange={(e) => {
                        const updated = {
                          ...selectedIdentity,
                          credentials: { ...selectedIdentity.credentials, password: e.target.value },
                        };
                        setSelectedIdentity(updated);
                        onUpdateIdentity(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={selectedIdentity.website.notes}
                      onChange={(e) => {
                        const updated = {
                          ...selectedIdentity,
                          website: { ...selectedIdentity.website, notes: e.target.value },
                        };
                        setSelectedIdentity(updated);
                        onUpdateIdentity(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <FieldRow label="Website" value={selectedIdentity.website.websiteName || 'Unspecified'} onCopy={onCopy} />
                  <FieldRow label="Website URL" value={selectedIdentity.website.websiteUrl || '—'} onCopy={onCopy} />
                  <FieldRow label="Full Name" value={selectedIdentity.core.fullName} onCopy={onCopy} />
                  <FieldRow label="Date of Birth" value={`${selectedIdentity.core.dateOfBirth} (${selectedIdentity.core.age} yrs)`} onCopy={onCopy} />
                  <FieldRow label="Username" value={selectedIdentity.credentials.username} onCopy={onCopy} mono />
                  <FieldRow label="Email" value={selectedIdentity.credentials.email} onCopy={onCopy} mono />
                  <FieldRow label="Password" value={selectedIdentity.credentials.password} onCopy={onCopy} mono />
                  <FieldRow label="Phone" value={selectedIdentity.location.phoneNumber} onCopy={onCopy} mono />
                  <FieldRow
                    label="Street Address"
                    value={`${selectedIdentity.location.streetAddress}, ${selectedIdentity.location.apartment}`}
                    onCopy={onCopy}
                  />
                  <FieldRow
                    label="City / State / ZIP"
                    value={`${selectedIdentity.location.city}, ${selectedIdentity.location.stateProvince} ${selectedIdentity.location.postalCode}`}
                    onCopy={onCopy}
                  />
                  <FieldRow label="Security Question" value={selectedIdentity.credentials.securityQuestion} onCopy={onCopy} />
                  <FieldRow label="Security Answer" value={selectedIdentity.credentials.securityAnswer} onCopy={onCopy} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  onCopy('Full Dossier', formatIdentitySummaryText(selectedIdentity))
                }
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 hover:underline"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Dossier Text</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIdentity(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
