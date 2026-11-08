# Virtual Names — Native Windows Privacy Persona & Demographic Identity Vault

**Virtual Names** is a native Windows desktop application designed to protect your real personal identity when signing up for untrusted, sketchy, or promotional websites.

## Key Features
- **Demographic-Aware Global Persona Generator**: Generate realistic fake personal details across **18 curated countries** (United States, Philippines, United Kingdom, Canada, Australia, Japan, South Korea, Germany, France, Spain, Italy, Netherlands, Sweden, Poland, Brazil, Mexico, Argentina, India, Singapore, Indonesia, UAE, South Africa) with accurate local names, phone numbers, streets, cities, states/provinces, and postal code formats.
- **Comprehensive Identity Dossier**:
  - **Personal**: First, Middle, Last, and Full Name, Gender, Date of Birth, Age, Nationality, Country Flag, and Initials Avatar.
  - **Credentials**: Primary Username + 4 instant alternative handles (Realistic, Cyber/Anon, Minimal, Gamer styles), Email Address (with presets for SimpleLogin, AnonAddy/addy.io, DuckDuckGo, Proton, or Custom Domain), Strong Password Generator, and Security Question & Answer.
  - **Address & Contact**: Street Address, Apartment/Unit, City, State/Province, Postal/ZIP Code, Country, and formatted Phone Number.
  - **Employment & Digital Footprint**: Job Title, Local Company Name, Department, Industry, Timezone, Currency, and Browser User-Agent string.
- **Website Exposure Context Tracker**: Attach the **Website Name**, **Website URL**, **Trust/Risk Level** (`Sketchy / Untrusted`, `Disposable`, `Promo / Gated`, `Testing / QA`, `Trusted Alias`), **Category Tag**, **Status** (`Active`, `Burned / Compromised`, `Archived`), and **Notes** to every generated identity.
- **Power-User Form-Filling Workflow**:
  - **1-Click Copy** on any individual field, Login Credentials, Full Address, or Full Dossier.
  - **Field Pinning / Locking**: Lock specific fields (like your custom email alias or preferred username) while regenerating the rest of the persona.
  - **Single-Field Reroll**: Regenerate any individual field on the fly.
  - **Mini Floating Mode (Always-on-Top)**: Switch the app into a compact floating companion window that stays above your browser while you fill out registration forms.
- **Local Vault with Optional AES-256-GCM Encryption**:
  - Automatically persists to `%APPDATA%\Virtual Names\virtual-names-vault.json`.
  - Search & filter saved identities by website, name, username, country, risk level, or status.
  - Optional **Master PIN / Password Lock** (PBKDF2 + AES-256-GCM encryption).
  - Full **JSON Backup Export/Import** and **CSV Spreadsheet Export**.
  - **Stealth Dark** and **Clean Light** themes with custom Windows 11 frameless window controls.

## Running the App
- **Standalone Portable App**: Double-click `release\VirtualNames-1.0.0-Portable.exe` or `Launch Virtual Names.bat`.
