import React, { useState } from 'react';
import {
  Sparkles,
  BookmarkPlus,
  Copy,
  Globe,
  ShieldAlert,
  User,
  MapPin,
  KeyRound,
  Briefcase,
  Unlock,
  Check,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import {
  COUNTRY_DEMOGRAPHICS,
  EMAIL_DOMAIN_PRESETS,
} from '../data/demographics';
import {
  AgeRangeOption,
  GenderOption,
  GeneratedIdentity,
  GeneratorOptions,
  LockableFieldKey,
  LockedFieldsMap,
  RiskLevel,
  WebsiteCategory,
  WebsiteContext,
} from '../types/identity';
import { formatIdentitySummaryText } from '../utils/vaultCrypto';
import { FieldRow } from './FieldRow';
import { PersonaAvatar } from './PersonaAvatar';

interface GeneratorWorkspaceProps {
  identity: GeneratedIdentity;
  options: GeneratorOptions;
  lockedFields: LockedFieldsMap;
  compactMode: boolean;
  onUpdateOptions: (partial: Partial<GeneratorOptions>) => void;
  onGenerateNew: (overrideOptions?: Partial<GeneratorOptions>) => void;
  onRerollField: (field: LockableFieldKey) => void;
  onToggleLock: (field: LockableFieldKey) => void;
  onClearAllLocks: () => void;
  onSelectAltUsername: (username: string) => void;
  onUpdateWebsiteContext: (partial: Partial<WebsiteContext>) => void;
  onSaveToVault: () => void;
  onCopy: (label: string, value: string) => void;
}

const RISK_OPTIONS: { value: RiskLevel; label: string; colorClass: string }[] = [
  {
    value: 'sketchy',
    label: 'Sketchy / Untrusted Site',
    colorClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  {
    value: 'disposable',
    label: 'Disposable / One-Off Signup',
    colorClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    value: 'promo',
    label: 'Promo / Gated Content',
    colorClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    value: 'testing',
    label: 'QA / Dev Testing',
    colorClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  },
  {
    value: 'trusted',
    label: 'Privacy Alias (Long-Term)',
    colorClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
];

const CATEGORIES: WebsiteCategory[] = [
  'Shopping',
  'Forum / Community',
  'Free Trial',
  'Software Download',
  'Crypto / Web3',
  'Sweepstakes / Promo',
  'Gaming',
  'Media / Streaming',
  'Adult / Dating',
  'Other',
];

export const GeneratorWorkspace: React.FC<GeneratorWorkspaceProps> = ({
  identity,
  options,
  lockedFields,
  compactMode,
  onUpdateOptions,
  onGenerateNew,
  onRerollField,
  onToggleLock,
  onClearAllLocks,
  onSelectAltUsername,
  onUpdateWebsiteContext,
  onSaveToVault,
  onCopy,
}) => {
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const lockedCount = Object.values(lockedFields).filter(Boolean).length;

  const handleSave = () => {
    onSaveToVault();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const fullFormattedAddress = `${identity.location.streetAddress}, ${identity.location.apartment}, ${identity.location.city}, ${identity.location.stateProvince} ${identity.location.postalCode}, ${identity.location.country}`;

  // COMPACT FLOATING MODE RENDER
  if (compactMode) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3">
        {/* Top Quick Bar */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#11151f] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <select
            value={options.countryCode}
            onChange={(e) => {
              onUpdateOptions({ countryCode: e.target.value });
              onGenerateNew({ countryCode: e.target.value });
            }}
            className="flex-1 bg-slate-100 dark:bg-slate-800/80 text-xs font-medium rounded-lg px-2.5 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
          >
            {COUNTRY_DEMOGRAPHICS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => onGenerateNew()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>

          <button
            onClick={handleSave}
            title="Save to Vault"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {justSaved ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <BookmarkPlus className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Target Website Input in Compact Mode */}
        <div className="bg-white dark:bg-[#11151f] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <input
              type="text"
              value={identity.website.websiteName}
              onChange={(e) => onUpdateWebsiteContext({ websiteName: e.target.value })}
              placeholder="Website used on (e.g. sketchy-dealz.com)..."
              className="w-full bg-transparent text-xs font-medium placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Compact Fields List */}
        <div className="space-y-1.5">
          <FieldRow
            compact
            label="Full Name"
            value={identity.core.fullName}
            fieldKey="firstName"
            isLocked={lockedFields.firstName}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
            badge={`${identity.core.gender} • ${identity.core.age}y`}
          />
          <FieldRow
            compact
            mono
            label="Username"
            value={identity.credentials.username}
            fieldKey="username"
            isLocked={lockedFields.username}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
          <FieldRow
            compact
            mono
            label="Email Address"
            value={identity.credentials.email}
            fieldKey="email"
            isLocked={lockedFields.email}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
          <FieldRow
            compact
            mono
            label="Password"
            value={identity.credentials.password}
            fieldKey="password"
            isLocked={lockedFields.password}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
          <FieldRow
            compact
            label="Date of Birth"
            value={identity.core.dateOfBirth}
            fieldKey="dateOfBirth"
            isLocked={lockedFields.dateOfBirth}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
          <FieldRow
            compact
            mono
            label="Phone Number"
            value={identity.location.phoneNumber}
            fieldKey="phoneNumber"
            isLocked={lockedFields.phoneNumber}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
          <FieldRow
            compact
            label="Street Address"
            value={`${identity.location.streetAddress}, ${identity.location.apartment}`}
            fieldKey="streetAddress"
            isLocked={lockedFields.streetAddress}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <FieldRow
              compact
              label="City"
              value={identity.location.city}
              fieldKey="city"
              isLocked={lockedFields.city}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              compact
              mono
              label="Postal / ZIP"
              value={identity.location.postalCode}
              fieldKey="postalCode"
              isLocked={lockedFields.postalCode}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
          </div>
          <FieldRow
            compact
            label="State / Province"
            value={identity.location.stateProvince}
            fieldKey="stateProvince"
            isLocked={lockedFields.stateProvince}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
          <FieldRow
            compact
            label="Security Q&A"
            value={`${identity.credentials.securityQuestion} — ${identity.credentials.securityAnswer}`}
            fieldKey="securityAnswer"
            isLocked={lockedFields.securityAnswer}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
          />
        </div>
      </div>
    );
  }

  // FULL DESKTOP WORKSPACE RENDER
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Top Demographic & Control Bar */}
      <div className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Country & Demographic Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Country Picker */}
            <div className="min-w-[230px]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Country & Demographic Base
              </label>
              <select
                value={options.countryCode}
                onChange={(e) => {
                  const newCode = e.target.value;
                  onUpdateOptions({ countryCode: newCode });
                  onGenerateNew({ countryCode: newCode });
                }}
                className="w-full bg-slate-50 dark:bg-[#161c28] text-slate-900 dark:text-slate-100 text-sm font-medium rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {COUNTRY_DEMOGRAPHICS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name} — {country.region}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Picker */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Gender
              </label>
              <select
                value={options.gender}
                onChange={(e) => {
                  const gender = e.target.value as GenderOption;
                  onUpdateOptions({ gender });
                  onGenerateNew({ gender });
                }}
                className="bg-slate-50 dark:bg-[#161c28] text-slate-900 dark:text-slate-100 text-sm font-medium rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
              >
                <option value="any">Any Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-Binary</option>
              </select>
            </div>

            {/* Age Range Picker */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Age Demographic
              </label>
              <select
                value={options.ageRange}
                onChange={(e) => {
                  const ageRange = e.target.value as AgeRangeOption;
                  onUpdateOptions({ ageRange });
                  onGenerateNew({ ageRange });
                }}
                className="bg-slate-50 dark:bg-[#161c28] text-slate-900 dark:text-slate-100 text-sm font-medium rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
              >
                <option value="any">All Adults (19–64)</option>
                <option value="18-24">Gen Z (18–24)</option>
                <option value="25-34">Young Adult (25–34)</option>
                <option value="35-44">Mid Career (35–44)</option>
                <option value="45-54">Established (45–54)</option>
                <option value="55+">Senior (55+)</option>
              </select>
            </div>

            {/* Username Style */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Handle Style
              </label>
              <select
                value={options.usernameStyle}
                onChange={(e) => {
                  const usernameStyle = e.target.value as GeneratorOptions['usernameStyle'];
                  onUpdateOptions({ usernameStyle });
                  onGenerateNew({ usernameStyle });
                }}
                className="bg-slate-50 dark:bg-[#161c28] text-slate-900 dark:text-slate-100 text-sm font-medium rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
              >
                <option value="realistic">Realistic Name Handle</option>
                <option value="cyber">Anon / Cyber Alias</option>
                <option value="minimal">Minimal Initials</option>
                <option value="gamer">Gamer Tag</option>
              </select>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5 self-end">
            <button
              type="button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              title="Configure Email Alias Domain & Password Rules"
              className={`p-2.5 rounded-xl border text-sm font-medium transition-colors ${
                showAdvancedConfig
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                  : 'bg-slate-50 dark:bg-[#161c28] border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onGenerateNew()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Identity</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                justSaved
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 border-transparent'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to Vault!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save Identity</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Options (Email Domain & Password Config) */}
        {showAdvancedConfig && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Email Alias / Domain Provider
              </label>
              <select
                value={options.emailDomainPreset}
                onChange={(e) => {
                  onUpdateOptions({ emailDomainPreset: e.target.value });
                  onGenerateNew({ emailDomainPreset: e.target.value });
                }}
                className="w-full bg-slate-50 dark:bg-[#161c28] text-xs font-medium rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
              >
                {EMAIL_DOMAIN_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {options.emailDomainPreset === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Custom Domain (e.g. myshield.com)
                </label>
                <input
                  type="text"
                  value={options.customEmailDomain}
                  onChange={(e) => onUpdateOptions({ customEmailDomain: e.target.value })}
                  placeholder="customdomain.com"
                  className="w-full bg-slate-50 dark:bg-[#161c28] text-xs font-medium rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Password Length ({options.passwordLength} chars)
                </label>
                <input
                  type="range"
                  min={10}
                  max={32}
                  value={options.passwordLength}
                  onChange={(e) =>
                    onUpdateOptions({ passwordLength: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSymbolsInPassword}
                  onChange={(e) =>
                    onUpdateOptions({ includeSymbolsInPassword: e.target.checked })
                  }
                  className="rounded accent-emerald-500"
                />
                <span>Symbols (!@#$)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Website Target & Sketchy Site Context Card */}
      <div className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Target Website & Identity Exposure Context
            </h3>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Track where this fake identity is used so you know who leaked or spammed it
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Website / Service Name
            </label>
            <input
              type="text"
              value={identity.website.websiteName}
              onChange={(e) => onUpdateWebsiteContext({ websiteName: e.target.value })}
              placeholder="e.g. SketchyPromoGiveaway"
              className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Website URL / Domain
            </label>
            <div className="relative">
              <input
                type="text"
                value={identity.website.websiteUrl}
                onChange={(e) => onUpdateWebsiteContext({ websiteUrl: e.target.value })}
                placeholder="https://sketchy-site.example"
                className="w-full bg-slate-50 dark:bg-[#161c28] text-sm rounded-xl pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
              />
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Site Trust / Risk Level
            </label>
            <select
              value={identity.website.riskLevel}
              onChange={(e) =>
                onUpdateWebsiteContext({ riskLevel: e.target.value as RiskLevel })
              }
              className="w-full bg-slate-50 dark:bg-[#161c28] text-sm font-medium rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
            >
              {RISK_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Category Tag
            </label>
            <select
              value={identity.website.category}
              onChange={(e) =>
                onUpdateWebsiteContext({ category: e.target.value as WebsiteCategory })
              }
              className="w-full bg-slate-50 dark:bg-[#161c28] text-sm font-medium rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-12">
            <input
              type="text"
              value={identity.website.notes}
              onChange={(e) => onUpdateWebsiteContext({ notes: e.target.value })}
              placeholder="Optional notes (e.g., 'Used for 14-day free software download trial, burner email forwarded via SimpleLogin')..."
              className="w-full bg-slate-50 dark:bg-[#161c28] text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Persona Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 dark:from-[#121722] dark:via-[#121824] dark:to-emerald-950/50 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PersonaAvatar core={identity.core} size="lg" />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">{identity.core.fullName}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 font-medium">
                {identity.core.flag} {identity.core.countryName}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                @{identity.credentials.username}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {identity.core.gender} • {identity.core.age} years old (Born {identity.core.dateOfBirth}) •{' '}
              {identity.employment.jobTitle} at {identity.employment.companyName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {identity.location.streetAddress}, {identity.location.city}, {identity.location.stateProvince}{' '}
              {identity.location.postalCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lockedCount > 0 && (
            <button
              type="button"
              onClick={onClearAllLocks}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unpin All ({lockedCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onCopy(
                'Login Credentials',
                `Username: ${identity.credentials.username}\nEmail: ${identity.credentials.email}\nPassword: ${identity.credentials.password}`
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Credentials</span>
          </button>

          <button
            type="button"
            onClick={() => onCopy('Full Identity Summary', formatIdentitySummaryText(identity))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Full Dossier</span>
          </button>
        </div>
      </div>

      {/* 4-Column Detailed Persona Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Personal & Demographic Details */}
        <section className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Personal & Demographic Details
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">{identity.core.nationality}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FieldRow
              label="First Name"
              value={identity.core.firstName}
              fieldKey="firstName"
              isLocked={lockedFields.firstName}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Last Name"
              value={identity.core.lastName}
              fieldKey="lastName"
              isLocked={lockedFields.lastName}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Middle Name"
              value={identity.core.middleName || 'N/A'}
              fieldKey="middleName"
              isLocked={lockedFields.middleName}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Full Name"
              value={identity.core.fullName}
              onCopy={onCopy}
            />
            <FieldRow
              label="Gender"
              value={identity.core.gender}
              fieldKey="gender"
              isLocked={lockedFields.gender}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Date of Birth"
              value={identity.core.dateOfBirth}
              badge={`${identity.core.age} yrs`}
              fieldKey="dateOfBirth"
              isLocked={lockedFields.dateOfBirth}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
              mono
            />
          </div>
        </section>

        {/* Card 2: Online Credentials & Security */}
        <section className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Credentials, Usernames & Security
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Anti-Correlation Handle</span>
          </div>

          <div className="space-y-2.5">
            <FieldRow
              label="Username / Handle"
              value={identity.credentials.username}
              fieldKey="username"
              isLocked={lockedFields.username}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
              mono
            />

            {/* Quick Alternate Username Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                Alt Handles:
              </span>
              {identity.credentials.altUsernames.map((alt) => (
                <button
                  key={alt}
                  type="button"
                  onClick={() => onSelectAltUsername(alt)}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors"
                >
                  {alt}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <FieldRow
                label="Email Address"
                value={identity.credentials.email}
                fieldKey="email"
                isLocked={lockedFields.email}
                onToggleLock={onToggleLock}
                onReroll={onRerollField}
                onCopy={onCopy}
                mono
              />
              <FieldRow
                label="Password"
                value={identity.credentials.password}
                fieldKey="password"
                isLocked={lockedFields.password}
                onToggleLock={onToggleLock}
                onReroll={onRerollField}
                onCopy={onCopy}
                mono
              />
              <FieldRow
                label="Security Question"
                value={identity.credentials.securityQuestion}
                fieldKey="securityQuestion"
                isLocked={lockedFields.securityQuestion}
                onToggleLock={onToggleLock}
                onReroll={onRerollField}
                onCopy={onCopy}
              />
              <FieldRow
                label="Security Answer"
                value={identity.credentials.securityAnswer}
                fieldKey="securityAnswer"
                isLocked={lockedFields.securityAnswer}
                onToggleLock={onToggleLock}
                onReroll={onRerollField}
                onCopy={onCopy}
              />
            </div>
          </div>
        </section>

        {/* Card 3: Geographic Address & Contact */}
        <section className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Address & Local Contact ({identity.core.flag} {identity.core.countryName})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onCopy('Full Address', fullFormattedAddress)}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Copy Full Line
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FieldRow
              label="Street Address"
              value={identity.location.streetAddress}
              fieldKey="streetAddress"
              isLocked={lockedFields.streetAddress}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Apartment / Unit"
              value={identity.location.apartment}
              onCopy={onCopy}
            />
            <FieldRow
              label="City / Municipality"
              value={identity.location.city}
              fieldKey="city"
              isLocked={lockedFields.city}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="State / Province / Region"
              value={identity.location.stateProvince}
              fieldKey="stateProvince"
              isLocked={lockedFields.stateProvince}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Postal / ZIP Code"
              value={identity.location.postalCode}
              fieldKey="postalCode"
              isLocked={lockedFields.postalCode}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
              mono
            />
            <FieldRow
              label="Phone Number"
              value={identity.location.phoneNumber}
              fieldKey="phoneNumber"
              isLocked={lockedFields.phoneNumber}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
              mono
            />
          </div>
        </section>

        {/* Card 4: Employment & Digital Footprint */}
        <section className="bg-white dark:bg-[#10141d] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Employment & Digital Environment
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {identity.location.timezone} • {identity.location.currency}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FieldRow
              label="Job Title / Role"
              value={identity.employment.jobTitle}
              fieldKey="jobTitle"
              isLocked={lockedFields.jobTitle}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Company / Organization"
              value={identity.employment.companyName}
              fieldKey="companyName"
              isLocked={lockedFields.companyName}
              onToggleLock={onToggleLock}
              onReroll={onRerollField}
              onCopy={onCopy}
            />
            <FieldRow
              label="Department & Industry"
              value={`${identity.employment.department} (${identity.employment.industry})`}
              onCopy={onCopy}
            />
            <FieldRow
              label="Backup / Recovery Email"
              value={identity.credentials.recoveryEmail}
              onCopy={onCopy}
              mono
            />
          </div>
          <FieldRow
            label="Browser User-Agent String"
            value={identity.employment.userAgent}
            fieldKey="userAgent"
            isLocked={lockedFields.userAgent}
            onToggleLock={onToggleLock}
            onReroll={onRerollField}
            onCopy={onCopy}
            mono
          />
        </section>
      </div>
    </div>
  );
};
