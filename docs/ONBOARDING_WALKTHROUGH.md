# Sobrkey Onboarding Walkthrough

## New User Flow (Happy Path)

### Total Time: ~10 seconds on mobile

---

### Step 1: Landing → Welcome (0s)
**URL**: `/` → `/auth/welcome`

**What the user sees**:
```
┌─────────────────────────────┐
│         [Key Icon]          │
│                             │
│    Welcome to Sobrkey       │
│                             │
│  Your private space to      │
│  connect. You own your      │
│  data.                      │
│                             │
│  ✓ Your key lives on this   │
│    device. We never see it. │
│  ✓ You control what you     │
│    share. No tracking.      │
│  ✓ Connect with others      │
│    safely and anonymously.  │
│                             │
│  [Create my key →]          │
│                             │
│  I already have a key       │
└─────────────────────────────┘
```

**User action**: Tap "Create my key"

---

### Step 2: Key Generation (1-2s)
**URL**: `/auth/create-key`

**What the user sees**:
```
┌─────────────────────────────┐
│                             │
│      [Spinning Icon]        │
│                             │
│  Setting up your secure     │
│  key…                       │
│                             │
│  This will only take a      │
│  moment                     │
│                             │
└─────────────────────────────┘
```

**Then** (after 1s):
```
┌─────────────────────────────┐
│                             │
│      [Check Mark Icon]      │
│                             │
│  You're set! 🎉             │
│                             │
│  Your key lives on this     │
│  device. We never see it.   │
│                             │
└─────────────────────────────┘
```

**What happens**:
1. Key generated automatically
2. Saved to localStorage
3. Success shown briefly
4. Auto-redirect to backup offer

**User action**: None (automatic)

---

### Step 3: Backup Offer (3-5s)
**URL**: `/auth/backup-offer`

**What the user sees**:
```
┌─────────────────────────────┐
│      [Shield Icon]          │
│                             │
│    Back up your key         │
│    Recommended for safety   │
│                             │
│  • Write it down or save    │
│    to a safe place          │
│  • This protects you if     │
│    you lose your device     │
│  • No one can recover it    │
│    for you—not even us      │
│                             │
│  [Back up now →]            │
│                             │
│  Do this later              │
│                             │
│  You can always backup your │
│  key later from Settings    │
└─────────────────────────────┘
```

**User action**: Choose one:
- **Option A**: Tap "Back up now" → Go to Step 4
- **Option B**: Tap "Do this later" → Skip to Step 5

---

### Step 4: Backup (Optional, 10-30s)
**URL**: `/auth/backup`

**What the user sees**:
```
┌─────────────────────────────┐
│            [×]              │
│                             │
│    Your key                 │
│    Save this in a safe      │
│    place. You'll need it    │
│    to access your account.  │
│                             │
│  ┌───────────────────────┐ │
│  │ ••••••••••••••••••••• │ │
│  │ ••••••••••••••••••••• │ [👁]
│  └───────────────────────┘ │
│                             │
│  [Copy]    [Download]       │
│                             │
│  ⚠️ Important               │
│  Anyone with this key can   │
│  access your account. Keep  │
│  it private and secure.     │
│                             │
│  ☐ I've saved my key in a   │
│    safe place              │
│                             │
│  [Continue →]  (disabled)   │
│                             │
│  Go back                    │
└─────────────────────────────┘
```

**User actions**:
1. Tap eye icon to reveal key (optional)
2. Tap "Copy" or "Download"
3. Save key somewhere safe
4. Check confirmation box
5. Tap "Continue"

**What happens**:
- Key copied/downloaded
- Backup marked as completed
- Toast confirmation shown

---

### Step 5: Done! (5-8s)
**URL**: `/auth/done`

**What the user sees**:
```
┌─────────────────────────────┐
│                             │
│    [Sparkle Icon]           │
│      (animated)             │
│                             │
│    All set 🎉               │
│                             │
│  You're ready to explore.   │
│  You stay in control.       │
│                             │
│  ✓ Your key is secure on    │
│    this device              │
│  ✓ Connect, share, and      │
│    support others safely    │
│  ✓ You can backup your key  │
│    anytime from Settings    │
│                             │
│  [Continue to Sobrkey →]    │
│                             │
│  Redirecting automatically  │
│  in 3 seconds...            │
└─────────────────────────────┘
```

**User action**: 
- Wait 3s (auto-redirect)
- OR tap "Continue" immediately

**Redirect to**: `/dashboard`

---

## Returning User Flow

### URL: `/` → `/auth/welcome`

**User action at welcome**: Tap "I already have a key"

### Import Screen
**URL**: `/auth/import`

**What the user sees**:
```
┌─────────────────────────────┐
│      [Key Icon]             │
│                             │
│    Import your key          │
│    We store it only on      │
│    this device              │
│                             │
│  Paste your key here        │
│  ┌───────────────────────┐ │
│  │ •••••••••••••••••••   │ │
│  └───────────────────────┘ │
│  Accepts nsec or hex format │
│                             │
│  🔒 Privacy at a glance:    │
│  We don't store your key.   │
│  It never leaves your       │
│  device.                    │
│                             │
│  [Use this key →]           │
│                             │
│  Go back                    │
└─────────────────────────────┘
```

**User actions**:
1. Paste key into field
2. Tap "Use this key"
3. OR press Enter

**If valid**:
- Key saved to localStorage
- Redirected to `/auth/done`

**If invalid**:
```
┌───────────────────────────┐
│  Paste your key here      │
│  ┌─────────────────────┐ │
│  │ bad-key-format      │ │ ← Red border
│  └─────────────────────┘ │
│  ⚠️ That key doesn't     │
│  look right. Please check│
│  and try again.          │
└───────────────────────────┘
```

---

## Edge Cases & Error Handling

### 1. User Already Logged In
**Trigger**: Visit `/auth/welcome` while logged in

**Behavior**:
- Automatically redirect to `/dashboard`
- No auth screens shown

---

### 2. localStorage Not Available
**Trigger**: Private browsing or storage quota exceeded

**What the user sees**:
```
┌─────────────────────────────┐
│                             │
│    Oops!                    │
│                             │
│  We need local storage to   │
│  keep your key on this      │
│  device.                    │
│                             │
│  [Go back]                  │
└─────────────────────────────┘
```

---

### 3. Key Generation Fails
**Trigger**: Rare crypto library error

**What the user sees**:
```
┌─────────────────────────────┐
│                             │
│    Oops!                    │
│                             │
│  We couldn't finish setting │
│  up. Try again.             │
│                             │
│  [Go back]                  │
└─────────────────────────────┘
```

**User action**: Tap "Go back" → Try again from welcome

---

### 4. Invalid Import Format
**Trigger**: User pastes invalid key

**Validation**:
- Must be non-empty
- Must be nsec1... (bech32) OR 64 hex characters

**Error message**: 
> "That key doesn't look right. Please check and try again."

---

### 5. Backup Reminder (Later)
**Trigger**: User skipped backup, browsing dashboard

**What the user sees** (bottom-right):
```
┌────────────────────────┐
│  [Shield] [×]          │
│                        │
│  Back up your key      │
│  Protect your account  │
│  by saving your key    │
│  in a safe place       │
│                        │
│  [Back up now]         │
└────────────────────────┘
```

**Dismissible**: Per session (comes back next session)

**Action**: Tap to go to `/auth/backup`

---

## Design Tokens Used

### Spacing
- `gap-2`, `gap-3`, `gap-4` (8px, 12px, 16px)
- `p-4`, `p-6` (16px, 24px)
- `space-y-4`, `space-y-6`, `space-y-8`

### Radius
- `rounded-lg` (0.5rem / 8px)
- `rounded-xl` (0.75rem / 12px)
- `rounded-2xl` (1rem / 16px)
- `rounded-full` (9999px)

### Colors

**Brand Gradient**:
```css
from-orange-500 to-purple-600
from-orange-600 to-purple-700 (hover)
```

**Backgrounds**:
```css
bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50
bg-white/60 backdrop-blur-sm
```

**Text**:
```css
text-gray-900 (headings)
text-gray-600 (body)
text-gray-500 (help text)
```

**Status Colors**:
- Success: `bg-green-500`, `text-green-600`
- Warning: `bg-amber-50`, `text-amber-600`
- Error: `bg-red-50`, `text-red-600`
- Info: `bg-blue-50`, `text-blue-600`

### Typography

**Headlines**:
```css
text-4xl font-bold (Welcome)
text-3xl font-bold (Section headers)
text-2xl font-bold (Subsections)
text-xl font-bold (Cards)
```

**Body**:
```css
text-lg (Primary body)
text-base (Default)
text-sm (Help text)
text-xs (Microcopy)
```

### Shadows
```css
shadow-lg (elevated elements)
shadow-md (cards)
shadow-sm (subtle elevation)
```

---

## Mobile Optimization

### Touch Targets
- All buttons: minimum 44x44px
- Icon buttons: 48x48px tap area
- Input fields: minimum 44px height

### Viewport
- Maximum width: 448px (28rem)
- Padding: 16px (1rem) sides
- Full height: `min-h-screen`

### Performance
- Images: Lazy loaded
- Animations: GPU accelerated
- Bundle: Code split by route
- Fonts: Preloaded

---

## Accessibility Quick Reference

### Keyboard Shortcuts
- `Tab`: Navigate forward
- `Shift+Tab`: Navigate backward
- `Enter`: Submit/Continue
- `Escape`: Dismiss/Go back
- `Space`: Toggle checkboxes

### Screen Reader Announcements
- Page changes announced
- Success/error messages announced
- Button states (disabled, loading) announced
- Form validation errors announced immediately

### Focus Management
- Focus trapped in dialogs
- Focus returned after dismissal
- Visible focus indicators
- Logical tab order

---

## Success Metrics

### Signup Flow
- ✅ Complete in < 10 seconds
- ✅ < 3 taps to dashboard (create path)
- ✅ 0 scary technical terms
- ✅ Clear at every step what's happening

### Import Flow
- ✅ Complete in < 5 seconds
- ✅ Clear error messages
- ✅ Graceful handling of invalid keys
- ✅ Same privacy messaging as signup

### Backup Flow
- ✅ Optional and skippable
- ✅ Resumable from settings
- ✅ Clear security messaging
- ✅ Multiple save options (copy/download)

---

## Next Steps After Onboarding

Once user reaches dashboard, they can:

1. **View public feed** - See community support posts
2. **Create first post** - Share their journey
3. **Explore 12 steps** - Begin structured recovery
4. **Chat with Mira** - AI support companion (coming soon)
5. **Join meetings** - Community spaces (coming soon)
6. **Access emergency resources** - Crisis support
7. **Customize profile** - Settings and preferences

---

## Developer Notes

### Testing the Flow

```bash
# Clear all auth state
localStorage.clear()
sessionStorage.clear()

# Visit home
window.location.href = '/'
```

### Triggering States

```javascript
// Simulate logged in
import { generateKey, saveKey } from '@/lib/key-manager'
const key = await generateKey()
await saveKey(key)

// Simulate backup completed
await markBackupCompleted()

// Simulate no backup
localStorage.removeItem('sobrkey_backup_completed')
```

### Debugging

```javascript
// Check current auth state
import { loadKey, hasCompletedBackup } from '@/lib/key-manager'

const key = await loadKey()
const backup = await hasCompletedBackup()

console.log({ key, backup })
```

---

## Changelog

### v1.0.0 (Current)
- Initial implementation
- Welcome, Create, Import, Backup, Done screens
- KeyManager service
- useAuth hook
- BackupReminder component
- Privacy-first messaging
- Mobile-optimized UI
- Accessibility compliance

### Planned
- Biometric unlock
- Multi-language support
- Progressive Web App install
- Hardware wallet integration
- Profile customization during onboarding
