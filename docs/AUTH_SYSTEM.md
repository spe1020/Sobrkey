# Sobrkey Authentication System

## Overview

The Sobrkey authentication system implements a privacy-first, user-friendly onboarding experience built on Nostr protocol principles. The system prioritizes clarity, trust, and accessibility while avoiding technical jargon.

## Design Principles

### 1. Plain Language
- **No crypto jargon**: Terms like "private key," "public key," and "seed phrase" are avoided in user-facing text
- **Short sentences**: Easy to read and understand
- **Warm, human tone**: Supportive and trustworthy copy

### 2. Privacy-First
- **Keys stay on device**: Never sent to any server
- **Local storage only**: Uses browser localStorage/IndexedDB
- **Clear privacy messaging**: Users know exactly what's stored and where
- **No tracking**: Minimal data collection

### 3. Mobile-First UI
- **Large tap targets**: Easy to use on mobile devices
- **Responsive design**: Works on all screen sizes
- **Fast interactions**: Minimal loading states
- **One primary action per screen**: Clear decision-making

### 4. Accessibility
- **AA+ compliance**: High contrast, readable text
- **Keyboard navigation**: Full keyboard support
- **Screen reader friendly**: Proper ARIA labels
- **Reduced motion support**: Respects user preferences

## User Journey

### 1. Welcome Screen (`/auth/welcome`)
**Purpose**: Set tone and establish trust

**Features**:
- Welcoming headline: "Welcome to Sobrkey"
- Clear value proposition: "Your private space to connect. You own your data."
- Trust indicators showing privacy features
- Primary CTA: "Create my key"
- Secondary link: "I already have a key"

**Copy highlights**:
- "Your key lives on this device. We never see it."
- "You control what you share. No tracking."
- "Connect with others safely and anonymously."

### 2. Create Key Screen (`/auth/create-key`)
**Purpose**: One-tap key generation

**Features**:
- Automatic key generation on mount
- Loading state: "Setting up your secure key…"
- Success state: "You're set! 🎉"
- Auto-redirect to backup offer
- Error handling with friendly messages

**Technical**:
- Uses `generateKey()` from KeyManager
- Saves to localStorage automatically
- 1-second minimum loading for better UX perception

### 3. Backup Offer Screen (`/auth/backup-offer`)
**Purpose**: Offer backup without fear or pressure

**Features**:
- Gentle recommendation: "Back up your key (recommended)"
- Clear benefits in bullet points
- Primary CTA: "Back up now"
- Secondary link: "Do this later" (always visible)
- Reassurance: "You can always backup your key later from Settings"

**Copy highlights**:
- "Write it down or save to a safe place"
- "This protects you if you lose your device"
- "No one can recover it for you—not even us"

### 4. Backup Screen (`/auth/backup`)
**Purpose**: Provide safe backup options

**Features**:
- Key display with show/hide toggle
- Copy to clipboard button
- Download as text file
- Explicit confirmation checkbox
- Warning about key security
- Disabled continue until confirmed

**UX Details**:
- Key hidden by default (security)
- Toast notifications for actions
- Clear warning: "Anyone with this key can access your account"
- Marks backup as completed in storage

### 5. Import Screen (`/auth/import`)
**Purpose**: Allow returning users to import keys

**Features**:
- Password-style input field
- Accepts both nsec and hex formats
- Real-time validation
- Gentle error messages
- Privacy assurance
- Enter key support for quick submission

**Validation**:
- Non-empty check
- Format validation (nsec1... or 64-char hex)
- Error: "That key doesn't look right. Please check and try again."

### 6. Done Screen (`/auth/done`)
**Purpose**: Celebrate completion and transition to app

**Features**:
- Success celebration: "All set 🎉"
- Reassurance of security
- Auto-redirect to dashboard (3 seconds)
- Manual continue button
- Final privacy reminders

**Copy highlights**:
- "You're ready to explore. You stay in control."
- "Your key is secure on this device"
- "You can backup your key anytime from Settings"

## Technical Architecture

### KeyManager Service (`lib/key-manager.ts`)

Core service for all key operations:

```typescript
// Generate new keypair
generateKey(): Promise<KeyPair>

// Import key (nsec or hex)
importKey(input: string): Promise<KeyPair>

// Save to localStorage
saveKey(keyPair: KeyPair): Promise<void>

// Load from localStorage
loadKey(): Promise<KeyPair | null>

// Check if key exists
hasKey(): Promise<boolean>

// Export for backup
exportKey(): Promise<string>

// Delete key
wipeKey(): Promise<void>

// Backup tracking
markBackupCompleted(): Promise<void>
hasCompletedBackup(): Promise<boolean>

// Validation
validateKeyFormat(input: string): boolean
```

### useAuth Hook (`hooks/useAuth.ts`)

React hook for auth state management:

```typescript
interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  privateKey: string | null;
  publicKey: string | null;
  npub: string | null;
  hasBackup: boolean;
}

useAuth() => {
  ...authState,
  logout: () => Promise<void>,
  refreshAuth: () => Promise<void>
}
```

### BackupReminder Component (`components/backup-reminder.tsx`)

Optional reminder component for users who haven't backed up:

**Features**:
- Dismissible (per session)
- Only shows if backup not completed
- Fixed position bottom-right
- Gentle nudge without blocking
- Links to backup flow

## Storage Schema

### localStorage Keys

```typescript
// Private key (nsec format)
'sobrkey_nsec': string

// Backup completion flag
'sobrkey_backup_completed': 'true' | null
```

### sessionStorage Keys

```typescript
// Backup reminder dismissal (per session)
'backup_reminder_dismissed': 'true' | null
```

## Security Considerations

1. **Keys never leave device**: All operations are client-side
2. **No server-side storage**: Keys stored only in browser localStorage
3. **Password-style inputs**: Private key inputs use `type="password"`
4. **Hidden by default**: Keys shown only when explicitly revealed
5. **Confirmation required**: Backup requires explicit user confirmation
6. **Clear warnings**: Users informed about key security importance

## Error Handling

### User-Friendly Error Messages

| Technical Error | User-Facing Message |
|----------------|---------------------|
| Key generation failed | "We couldn't finish setting up. Try again." |
| Invalid key format | "That key doesn't look right. Please check and try again." |
| Storage denied | "We need local storage to keep your key on this device." |
| Export failed | "We couldn't export your key. Please try again." |

### Error Recovery

- Corrupted keys automatically cleared
- Failed operations allow retry
- Clear "Go back" options on error screens
- No data loss on validation failures

## Accessibility Features

### Keyboard Navigation
- Tab order follows visual flow
- Enter key submits forms
- Escape dismisses dialogs
- Focus visible on all interactive elements

### Screen Readers
- Proper heading hierarchy (h1, h2, etc.)
- ARIA labels on icon buttons
- Descriptive link text
- Form labels properly associated

### Visual Design
- Minimum 4.5:1 contrast ratio
- Large tap targets (44x44px minimum)
- Clear focus indicators
- No information conveyed by color alone

### Motion
- Respects `prefers-reduced-motion`
- Animations not required for understanding
- Auto-redirect has manual alternative

## Copy Guidelines

### Tone & Voice

**Do say**:
- "Your key lives on this device"
- "We never store your information"
- "You control what you share"
- "Back up your key"
- "Safe place"

**Avoid**:
- "Seed phrase"
- "Public key" / "Private key" (use "your key")
- "Cryptography"
- "Protocol"
- Technical jargon

### Microcopy Examples

**Invalid key error**:
> "That key doesn't look right. Please check and try again."

**Backup explanation**:
> "Backing up keeps you safe if you lose this device."

**Privacy assurance**:
> "Private by default. We don't collect your data."

**Success message**:
> "You're set! Your key stays on this device. We never see it."

## Testing Checklist

### Functional Testing
- [ ] Welcome screen loads and displays correctly
- [ ] "Create my key" generates and saves key
- [ ] "I already have a key" navigates to import
- [ ] Key generation shows loading then success
- [ ] Backup offer shows after key creation
- [ ] Backup screen displays key correctly
- [ ] Copy button copies key to clipboard
- [ ] Download button saves key as .txt file
- [ ] Confirmation checkbox enables continue
- [ ] Import validates nsec format
- [ ] Import validates hex format
- [ ] Import rejects invalid formats
- [ ] Import shows clear error messages
- [ ] Done screen auto-redirects after 3s
- [ ] Done screen manual redirect works
- [ ] Backup reminder shows when appropriate
- [ ] Backup reminder dismisses correctly

### Accessibility Testing
- [ ] Keyboard navigation works throughout
- [ ] Tab order is logical
- [ ] Focus visible on all elements
- [ ] Screen reader announces all content
- [ ] ARIA labels present on icon buttons
- [ ] Contrast ratios meet AA standard
- [ ] Text scales up to 200%
- [ ] Works with reduced motion

### Cross-Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Performance
- [ ] Auth bundle < 120KB gzipped
- [ ] Time to interactive < 2s on 4G
- [ ] No layout shift during loading
- [ ] Smooth transitions between screens

## Future Enhancements

### Potential Features
1. **Biometric backup**: Use device biometrics to unlock key
2. **Multi-device sync**: Encrypted key sync across devices (opt-in)
3. **Recovery contacts**: Trusted contacts for key recovery (Nostr-native)
4. **Hardware wallet support**: Integration with hardware wallets
5. **Progressive Web App**: Install as standalone app
6. **Key rotation**: Ability to generate new key and migrate identity
7. **Backup reminders**: Smarter reminders based on usage
8. **Onboarding checklist**: Help users complete profile setup

### Internationalization
- Structure already supports i18n
- Keep sentences short for easy translation
- Avoid emoji in critical text
- Use `i18n()` wrapper function (to be implemented)

## Metrics & Analytics

### Key Metrics (Privacy-Safe)
- Signup completion rate (local-only)
- Backup completion rate (local-only)
- Time to complete onboarding
- Drop-off points in flow

### Implementation
- All analytics local-only by default
- Explicit opt-in for any remote telemetry
- No PII collected
- Anonymous event tracking only

## Support & Documentation

### User-Facing Help
- Add "?" icon linking to help articles
- Inline help text on each screen
- FAQ section in app
- Contact support option

### Developer Documentation
- This document
- Code comments in KeyManager
- Type definitions for all interfaces
- Example usage in components

## Maintenance

### Regular Review
- Test auth flow monthly
- Review error messages quarterly
- Update copy based on user feedback
- Monitor browser localStorage limits
- Test on new browser versions

### Dependencies
- `nostr-tools`: Key generation and encoding
- `@noble/hashes`: Cryptographic operations
- `sonner`: Toast notifications
- `lucide-react`: Icons

## Conclusion

The Sobrkey authentication system balances security, usability, and privacy. By using plain language, clear visuals, and thoughtful UX, we make Nostr accessible to everyone—not just technical users.

**Core Values**:
1. Privacy first, always
2. Clarity over cleverness
3. Trust through transparency
4. Accessibility for all
5. Human, not corporate

Remember: The goal is to get users to a point where they feel safe, in control, and ready to engage with the community—all in under 10 seconds on mobile.
