import { describe, it, expect } from 'vitest';
import { COUNTRY_DEMOGRAPHICS } from './data/demographics';
import {
  generateIdentity,
  generateStrongPassword,
  rerollSingleField,
} from './utils/generator';
import {
  decryptVaultIdentities,
  encryptVaultIdentities,
  identitiesToCsv,
} from './utils/vaultCrypto';
import { GeneratorOptions } from './types/identity';

const BASE_OPTIONS: GeneratorOptions = {
  countryCode: 'PH',
  gender: 'female',
  ageRange: '25-34',
  emailDomainPreset: 'privacy-mix',
  customEmailDomain: '',
  passwordLength: 18,
  includeSymbolsInPassword: true,
  usernameStyle: 'realistic',
};

describe('Virtual Names Demographic & Identity Engine', () => {
  it('supports all curated countries with valid demographic data and local phone/address formats', () => {
    expect(COUNTRY_DEMOGRAPHICS.length).toBeGreaterThanOrEqual(18);

    for (const country of COUNTRY_DEMOGRAPHICS) {
      const identity = generateIdentity({
        ...BASE_OPTIONS,
        countryCode: country.code,
      });

      expect(identity.core.countryCode).toBe(country.code);
      expect(identity.core.countryName).toBe(country.name);
      expect(identity.core.fullName.length).toBeGreaterThan(2);
      expect(identity.location.phoneNumber.startsWith(country.phoneCountryCode)).toBe(true);
      expect(identity.location.city.length).toBeGreaterThan(1);
      expect(identity.location.postalCode.length).toBeGreaterThan(2);
      expect(identity.credentials.username.length).toBeGreaterThan(3);
      expect(identity.credentials.email).toContain('@');
    }
  });

  it('respects gender and age range demographic filters', () => {
    const id = generateIdentity({
      ...BASE_OPTIONS,
      countryCode: 'JP',
      gender: 'male',
      ageRange: '35-44',
    });

    expect(id.core.gender).toBe('Male');
    expect(id.core.age).toBeGreaterThanOrEqual(35);
    expect(id.core.age).toBeLessThanOrEqual(44);
    expect(id.core.countryName).toBe('Japan');
  });

  it('preserves locked/pinned fields when regenerating identity', () => {
    const first = generateIdentity(BASE_OPTIONS);
    const second = generateIdentity(
      { ...BASE_OPTIONS, countryCode: 'DE' },
      first,
      { firstName: true, username: true, password: true },
      {
        websiteName: 'SketchyGiveaway.io',
        websiteUrl: 'https://sketchygiveaway.io',
        riskLevel: 'sketchy',
        category: 'Sweepstakes / Promo',
        status: 'active',
        notes: 'Test note',
      }
    );

    expect(second.core.firstName).toBe(first.core.firstName);
    expect(second.credentials.username).toBe(first.credentials.username);
    expect(second.credentials.password).toBe(first.credentials.password);
    expect(second.core.countryCode).toBe('DE');
    expect(second.website.websiteName).toBe('SketchyGiveaway.io');
  });

  it('rerolls only a single targeted field while keeping others intact', () => {
    const initial = generateIdentity(BASE_OPTIONS);
    const rerolled = rerollSingleField(initial, 'password', BASE_OPTIONS);

    expect(rerolled.core.fullName).toBe(initial.core.fullName);
    expect(rerolled.location.streetAddress).toBe(initial.location.streetAddress);
    expect(rerolled.credentials.username).toBe(initial.credentials.username);
    expect(rerolled.credentials.password).not.toBe(initial.credentials.password);
  });

  it('generates passwords matching requested length', () => {
    const pwd = generateStrongPassword(24, true);
    expect(pwd.length).toBe(24);
  });

  it('encrypts and decrypts vault identities with AES-256-GCM and exports CSV', async () => {
    const sample1 = generateIdentity(BASE_OPTIONS);
    sample1.website.websiteName = 'UntrustedForum.net';
    const sample2 = generateIdentity({ ...BASE_OPTIONS, countryCode: 'US' });

    const encryptedFile = await encryptVaultIdentities(
      [sample1, sample2],
      'MySecretPin999'
    );
    expect(encryptedFile.encrypted).toBe(true);
    expect(encryptedFile.cipherText).toBeDefined();
    expect(encryptedFile.identities).toBeUndefined();

    const decrypted = await decryptVaultIdentities(encryptedFile, 'MySecretPin999');
    expect(decrypted.length).toBe(2);
    expect(decrypted[0].website.websiteName).toBe('UntrustedForum.net');
    expect(decrypted[1].core.countryCode).toBe('US');

    const csv = identitiesToCsv(decrypted);
    expect(csv).toContain('UntrustedForum.net');
    expect(csv).toContain(sample1.core.fullName);
  });
});
