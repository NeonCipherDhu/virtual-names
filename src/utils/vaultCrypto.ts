import { GeneratedIdentity, VaultStorageFile } from '../types/identity';

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(pinOrPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pinOrPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVaultIdentities(
  identities: GeneratedIdentity[],
  pinOrPassword: string,
  settings?: VaultStorageFile['settings']
): Promise<VaultStorageFile> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pinOrPassword, salt);

  const enc = new TextEncoder();
  const plainBytes = enc.encode(JSON.stringify(identities));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    plainBytes
  );

  return {
    version: 1,
    encrypted: true,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    cipherText: bufferToBase64(cipherBuffer),
    settings,
  };
}

export async function decryptVaultIdentities(
  vaultFile: VaultStorageFile,
  pinOrPassword: string
): Promise<GeneratedIdentity[]> {
  if (!vaultFile.encrypted) {
    return vaultFile.identities || [];
  }
  if (!vaultFile.salt || !vaultFile.iv || !vaultFile.cipherText) {
    throw new Error('Corrupted encrypted vault file.');
  }

  const salt = base64ToUint8Array(vaultFile.salt);
  const iv = base64ToUint8Array(vaultFile.iv);
  const cipherBytes = base64ToUint8Array(vaultFile.cipherText);

  const key = await deriveKey(pinOrPassword, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    cipherBytes as unknown as BufferSource
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(plainBuffer);
  return JSON.parse(jsonStr) as GeneratedIdentity[];
}

export function identitiesToCsv(identities: GeneratedIdentity[]): string {
  const headers = [
    'ID',
    'Website Name',
    'Website URL',
    'Risk Level',
    'Category',
    'Status',
    'Full Name',
    'Gender',
    'Date of Birth',
    'Age',
    'Country',
    'Username',
    'Email',
    'Password',
    'Phone Number',
    'Street Address',
    'Apartment',
    'City',
    'State/Province',
    'Postal Code',
    'Security Question',
    'Security Answer',
    'Job Title',
    'Company',
    'Notes',
    'Created At',
  ];

  const escapeCsv = (val: string | number | undefined): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = identities.map((id) =>
    [
      id.id,
      id.website.websiteName,
      id.website.websiteUrl,
      id.website.riskLevel,
      id.website.category,
      id.website.status,
      id.core.fullName,
      id.core.gender,
      id.core.dateOfBirth,
      id.core.age,
      id.core.countryName,
      id.credentials.username,
      id.credentials.email,
      id.credentials.password,
      id.location.phoneNumber,
      id.location.streetAddress,
      id.location.apartment,
      id.location.city,
      id.location.stateProvince,
      id.location.postalCode,
      id.credentials.securityQuestion,
      id.credentials.securityAnswer,
      id.employment.jobTitle,
      id.employment.companyName,
      id.website.notes,
      id.createdAt,
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\r\n');
}

export function formatIdentitySummaryText(id: GeneratedIdentity): string {
  return [
    `=== VIRTUAL NAMES PERSONA ===`,
    `Website: ${id.website.websiteName || 'Unspecified'} (${id.website.websiteUrl || 'No URL'}) [${id.website.riskLevel.toUpperCase()}]`,
    `Full Name: ${id.core.fullName} (${id.core.gender}, ${id.core.age} yrs, DOB: ${id.core.dateOfBirth})`,
    `Country: ${id.core.flag} ${id.core.countryName} (${id.core.nationality})`,
    `Username: ${id.credentials.username}`,
    `Email: ${id.credentials.email}`,
    `Password: ${id.credentials.password}`,
    `Security Q&A: ${id.credentials.securityQuestion} -> ${id.credentials.securityAnswer}`,
    `Phone: ${id.location.phoneNumber}`,
    `Address: ${id.location.streetAddress}, ${id.location.apartment}, ${id.location.city}, ${id.location.stateProvince} ${id.location.postalCode}, ${id.location.country}`,
    `Employment: ${id.employment.jobTitle} at ${id.employment.companyName} (${id.employment.industry})`,
    id.website.notes ? `Notes: ${id.website.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
