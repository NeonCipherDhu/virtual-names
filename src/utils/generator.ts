import {
  COUNTRY_DEMOGRAPHICS,
  CountryDemographicProfile,
  EMAIL_DOMAIN_PRESETS,
  JOB_ROLES,
  SECURITY_QUESTIONS,
  USER_AGENTS,
} from '../data/demographics';
import {
  AgeRangeOption,
  GeneratedIdentity,
  GeneratorOptions,
  LockableFieldKey,
  LockedFieldsMap,
  WebsiteContext,
} from '../types/identity';

const AVATAR_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

const CYBER_ADJECTIVES = [
  'silent', 'shadow', 'neon', 'cipher', 'phantom', 'orbit', 'quantum', 'cobalt',
  'velvet', 'arctic', 'nova', 'vector', 'prism', 'stealth', 'echo', 'hyper', 'astral'
];

const CYBER_NOUNS = [
  'fox', 'lynx', 'falcon', 'raven', 'nomad', 'pilot', 'voyager', 'spark',
  'warden', 'spectre', 'drifter', 'pulse', 'vertex', 'nexus', 'ghost', 'hawk'
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeAscii(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function expandPattern(pattern: string): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '#') {
      // avoid leading 0 if first char of a block unless pattern explicitly has '0'
      const digit = i === 0 ? randomInt(1, 9) : randomInt(0, 9);
      result += digit.toString();
    } else if (ch === 'A') {
      result += letters[randomInt(0, letters.length - 1)];
    } else {
      result += ch;
    }
  }
  return result;
}

export function getCountryProfile(countryCode: string): CountryDemographicProfile {
  return (
    COUNTRY_DEMOGRAPHICS.find((c) => c.code === countryCode) ||
    COUNTRY_DEMOGRAPHICS[0]
  );
}

function generateBirthDateAndAge(ageRange: AgeRangeOption): { dateOfBirth: string; age: number } {
  let minAge = 21;
  let maxAge = 58;
  switch (ageRange) {
    case '18-24':
      minAge = 18;
      maxAge = 24;
      break;
    case '25-34':
      minAge = 25;
      maxAge = 34;
      break;
    case '35-44':
      minAge = 35;
      maxAge = 44;
      break;
    case '45-54':
      minAge = 45;
      maxAge = 54;
      break;
    case '55+':
      minAge = 55;
      maxAge = 72;
      break;
    default:
      minAge = 19;
      maxAge = 64;
      break;
  }

  const age = randomInt(minAge, maxAge);
  const now = new Date();
  const birthYear = now.getFullYear() - age;
  const birthMonth = randomInt(1, 12);
  const birthDay = randomInt(1, 28);

  const yyyy = birthYear.toString();
  const mm = birthMonth.toString().padStart(2, '0');
  const dd = birthDay.toString().padStart(2, '0');

  return {
    dateOfBirth: `${yyyy}-${mm}-${dd}`,
    age,
  };
}

export function generateUsernames(
  firstName: string,
  lastName: string,
  birthYear: string,
  style: GeneratorOptions['usernameStyle'] = 'realistic'
): { primary: string; alternatives: string[] } {
  const cleanFirst = normalizeAscii(firstName) || 'alex';
  const cleanLast = normalizeAscii(lastName) || 'vance';
  const shortYear = birthYear.slice(-2);
  const randNum = randomInt(10, 999).toString();
  const adj = pickRandom(CYBER_ADJECTIVES);
  const noun = pickRandom(CYBER_NOUNS);

  const realistic1 = `${cleanFirst}.${cleanLast}${shortYear}`;
  const realistic2 = `${cleanFirst}_${cleanLast}${randomInt(10, 89)}`;
  const minimal1 = `${cleanFirst.slice(0, 1)}${cleanLast}${randomInt(100, 999)}`;
  const cyber1 = `${adj}_${noun}${randomInt(10, 99)}`;
  const gamer1 = `${ adj.charAt(0).toUpperCase() + adj.slice(1) }${ noun.charAt(0).toUpperCase() + noun.slice(1) }_${shortYear}`;

  let primary = realistic1;
  if (style === 'cyber') primary = cyber1;
  else if (style === 'minimal') primary = minimal1;
  else if (style === 'gamer') primary = gamer1;
  else primary = pickRandom([realistic1, realistic2, `${cleanFirst}${cleanLast.slice(0, 3)}${randNum}`]);

  const alternatives = Array.from(
    new Set([realistic1, realistic2, minimal1, cyber1, gamer1].filter((u) => u !== primary))
  ).slice(0, 4);

  return { primary, alternatives };
}

export function generateStrongPassword(length = 16, includeSymbols = true): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*_-+=';

  const pool = includeSymbols ? upper + lower + digits + symbols : upper + lower + digits;
  const required = [
    pickRandom(upper.split('')),
    pickRandom(lower.split('')),
    pickRandom(digits.split('')),
  ];
  if (includeSymbols) {
    required.push(pickRandom(symbols.split('')));
  }

  const remainingLength = Math.max(8, length) - required.length;
  for (let i = 0; i < remainingLength; i++) {
    required.push(pool[randomInt(0, pool.length - 1)]);
  }

  // Shuffle
  for (let i = required.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const temp = required[i];
    required[i] = required[j];
    required[j] = temp;
  }

  return required.join('');
}

function buildStreetAddress(profile: CountryDemographicProfile): string {
  const street = pickRandom(profile.streetNames);
  const suffix = profile.streetSuffixes.filter(Boolean).length > 0 ? pickRandom(profile.streetSuffixes) : '';
  const houseNumber = randomInt(12, 4890);

  if (profile.addressFormat === 'jp-block') {
    const chome = randomInt(1, 5);
    const ban = randomInt(1, 24);
    const go = randomInt(1, 18);
    return `${chome}-${ban}-${go} ${street}`;
  }

  if (profile.addressFormat === 'street-first') {
    return `${street}${suffix ? ' ' + suffix : ''} ${randomInt(1, 185)}`;
  }

  return `${houseNumber} ${street}${suffix ? ' ' + suffix : ''}`;
}

function resolveEmailDomain(options: GeneratorOptions): string {
  if (options.emailDomainPreset === 'custom' && options.customEmailDomain.trim()) {
    return options.customEmailDomain.trim().replace(/^@/, '');
  }
  const preset = EMAIL_DOMAIN_PRESETS.find((p) => p.id === options.emailDomainPreset);
  if (preset && preset.domains.length > 0) {
    return pickRandom(preset.domains);
  }
  return pickRandom(EMAIL_DOMAIN_PRESETS[0].domains);
}

export function generateIdentity(
  options: GeneratorOptions,
  currentIdentity?: GeneratedIdentity,
  lockedFields: LockedFieldsMap = {},
  websiteContext?: WebsiteContext
): GeneratedIdentity {
  const profile = getCountryProfile(options.countryCode);

  // Determine Gender
  let resolvedGender: 'Male' | 'Female' | 'Non-binary' = 'Male';
  if (lockedFields.gender && currentIdentity) {
    resolvedGender = currentIdentity.core.gender;
  } else if (options.gender === 'male') {
    resolvedGender = 'Male';
  } else if (options.gender === 'female') {
    resolvedGender = 'Female';
  } else if (options.gender === 'non-binary') {
    resolvedGender = 'Non-binary';
  } else {
    resolvedGender = pickRandom(['Male', 'Female']);
  }

  // Names
  const firstPool =
    resolvedGender === 'Male'
      ? profile.maleFirstNames
      : resolvedGender === 'Female'
      ? profile.femaleFirstNames
      : profile.neutralFirstNames.length > 0
      ? profile.neutralFirstNames
      : [...profile.maleFirstNames, ...profile.femaleFirstNames];

  const firstName =
    lockedFields.firstName && currentIdentity
      ? currentIdentity.core.firstName
      : pickRandom(firstPool);

  const middlePool = profile.middleNames.filter(Boolean);
  const middleName =
    lockedFields.middleName && currentIdentity
      ? currentIdentity.core.middleName
      : middlePool.length > 0
      ? pickRandom(middlePool)
      : '';

  const lastName =
    lockedFields.lastName && currentIdentity
      ? currentIdentity.core.lastName
      : pickRandom(profile.lastNames);

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  // DOB & Age
  const dobGenerated = generateBirthDateAndAge(options.ageRange);
  const dateOfBirth =
    lockedFields.dateOfBirth && currentIdentity
      ? currentIdentity.core.dateOfBirth
      : dobGenerated.dateOfBirth;
  const age =
    lockedFields.dateOfBirth && currentIdentity
      ? currentIdentity.core.age
      : dobGenerated.age;

  // City / State / Postal
  const cityRecord = pickRandom(profile.cities);
  const streetAddress =
    lockedFields.streetAddress && currentIdentity
      ? currentIdentity.location.streetAddress
      : buildStreetAddress(profile);

  const apartment = expandPattern(pickRandom(profile.apartmentFormats));

  const city =
    lockedFields.city && currentIdentity
      ? currentIdentity.location.city
      : cityRecord.city;

  const stateProvince =
    lockedFields.stateProvince && currentIdentity
      ? currentIdentity.location.stateProvince
      : cityRecord.stateProvince;

  const postalCode =
    lockedFields.postalCode && currentIdentity
      ? currentIdentity.location.postalCode
      : expandPattern(cityRecord.postalPattern);

  const localPhone = expandPattern(profile.phonePattern);
  const phoneNumber =
    lockedFields.phoneNumber && currentIdentity
      ? currentIdentity.location.phoneNumber
      : `${profile.phoneCountryCode} ${localPhone}`;

  // Credentials
  const birthYear = dateOfBirth.split('-')[0] || '1995';
  const usernameBundle = generateUsernames(firstName, lastName, birthYear, options.usernameStyle);
  const username =
    lockedFields.username && currentIdentity
      ? currentIdentity.credentials.username
      : usernameBundle.primary;

  const emailDomain = resolveEmailDomain(options);
  const email =
    lockedFields.email && currentIdentity
      ? currentIdentity.credentials.email
      : `${username}@${emailDomain}`;

  const recoveryEmail = `${normalizeAscii(firstName)}.recovery${randomInt(10, 99)}@proton.me`;

  const password =
    lockedFields.password && currentIdentity
      ? currentIdentity.credentials.password
      : generateStrongPassword(options.passwordLength, options.includeSymbolsInPassword);

  const secQA = pickRandom(SECURITY_QUESTIONS);
  const securityQuestion =
    lockedFields.securityQuestion && currentIdentity
      ? currentIdentity.credentials.securityQuestion
      : secQA.question;
  const securityAnswer =
    lockedFields.securityAnswer && currentIdentity
      ? currentIdentity.credentials.securityAnswer
      : pickRandom(secQA.answers);

  // Employment
  const jobRole = pickRandom(JOB_ROLES);
  const jobTitle =
    lockedFields.jobTitle && currentIdentity
      ? currentIdentity.employment.jobTitle
      : jobRole.title;
  const companyName =
    lockedFields.companyName && currentIdentity
      ? currentIdentity.employment.companyName
      : pickRandom(profile.localCompanies);
  const userAgent =
    lockedFields.userAgent && currentIdentity
      ? currentIdentity.employment.userAgent
      : pickRandom(USER_AGENTS);

  const nowIso = new Date().toISOString();

  return {
    id: currentIdentity?.id || `id_${Date.now()}_${randomInt(1000, 9999)}`,
    createdAt: currentIdentity?.createdAt || nowIso,
    updatedAt: nowIso,
    favorite: currentIdentity?.favorite || false,
    core: {
      firstName,
      middleName,
      lastName,
      fullName,
      gender: resolvedGender,
      dateOfBirth,
      age,
      nationality: profile.nationality,
      countryCode: profile.code,
      countryName: profile.name,
      flag: profile.flag,
      avatarSeed: `${firstName}-${lastName}-${randomInt(1, 999)}`,
      avatarColor: pickRandom(AVATAR_COLORS),
    },
    location: {
      streetAddress,
      apartment,
      city,
      stateProvince,
      postalCode,
      country: profile.name,
      phoneNumber,
      phoneCountryCode: profile.phoneCountryCode,
      timezone: profile.timezone,
      currency: profile.currency,
    },
    credentials: {
      username,
      altUsernames: usernameBundle.alternatives,
      email,
      emailDomain,
      recoveryEmail,
      password,
      securityQuestion,
      securityAnswer,
    },
    employment: {
      jobTitle,
      companyName,
      department: jobRole.department,
      industry: jobRole.industry,
      userAgent,
    },
    website: websiteContext || currentIdentity?.website || {
      websiteName: '',
      websiteUrl: '',
      riskLevel: 'sketchy',
      category: 'Other',
      status: 'active',
      notes: '',
    },
  };
}

export function rerollSingleField(
  identity: GeneratedIdentity,
  field: LockableFieldKey,
  options: GeneratorOptions
): GeneratedIdentity {
  // Lock every field EXCEPT the requested field
  const allLockable: LockableFieldKey[] = [
    'firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth',
    'streetAddress', 'city', 'stateProvince', 'postalCode', 'phoneNumber',
    'username', 'email', 'password', 'securityQuestion', 'securityAnswer',
    'jobTitle', 'companyName', 'userAgent'
  ];

  const tempLocks: LockedFieldsMap = {};
  for (const key of allLockable) {
    tempLocks[key] = key !== field;
  }

  // If username is rerolled and email wasn't explicitly locked by user, also refresh email handle to match
  const updated = generateIdentity(options, identity, tempLocks, identity.website);
  return updated;
}
