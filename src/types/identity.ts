export type GenderOption = 'any' | 'male' | 'female' | 'non-binary';
export type AgeRangeOption = 'any' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';

export type RiskLevel = 'sketchy' | 'disposable' | 'promo' | 'testing' | 'trusted';
export type IdentityStatus = 'active' | 'burned' | 'archived';

export type WebsiteCategory =
  | 'Shopping'
  | 'Forum / Community'
  | 'Free Trial'
  | 'Software Download'
  | 'Crypto / Web3'
  | 'Sweepstakes / Promo'
  | 'Gaming'
  | 'Media / Streaming'
  | 'Adult / Dating'
  | 'Other';

export interface PersonaCore {
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Non-binary';
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  nationality: string;
  countryCode: string;
  countryName: string;
  flag: string;
  avatarSeed: string;
  avatarColor: string;
}

export interface PersonaLocation {
  streetAddress: string;
  apartment: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  phoneCountryCode: string;
  timezone: string;
  currency: string;
}

export interface PersonaCredentials {
  username: string;
  altUsernames: string[];
  email: string;
  emailDomain: string;
  recoveryEmail: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

export interface PersonaEmployment {
  jobTitle: string;
  companyName: string;
  department: string;
  industry: string;
  userAgent: string;
}

export interface WebsiteContext {
  websiteName: string;
  websiteUrl: string;
  riskLevel: RiskLevel;
  category: WebsiteCategory;
  status: IdentityStatus;
  notes: string;
}

export interface GeneratedIdentity {
  id: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  core: PersonaCore;
  location: PersonaLocation;
  credentials: PersonaCredentials;
  employment: PersonaEmployment;
  website: WebsiteContext;
}

export type LockableFieldKey =
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'gender'
  | 'dateOfBirth'
  | 'streetAddress'
  | 'city'
  | 'stateProvince'
  | 'postalCode'
  | 'phoneNumber'
  | 'username'
  | 'email'
  | 'password'
  | 'securityQuestion'
  | 'securityAnswer'
  | 'jobTitle'
  | 'companyName'
  | 'userAgent';

export type LockedFieldsMap = Partial<Record<LockableFieldKey, boolean>>;

export interface GeneratorOptions {
  countryCode: string;
  gender: GenderOption;
  ageRange: AgeRangeOption;
  emailDomainPreset: string;
  customEmailDomain: string;
  passwordLength: number;
  includeSymbolsInPassword: boolean;
  usernameStyle: 'realistic' | 'cyber' | 'minimal' | 'gamer';
}

export interface VaultStorageFile {
  version: number;
  encrypted: boolean;
  salt?: string;
  iv?: string;
  cipherText?: string;
  identities?: GeneratedIdentity[];
  settings?: {
    theme: 'dark' | 'light';
    defaultCountryCode: string;
    defaultEmailDomain: string;
  };
}
