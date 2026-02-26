# PWA Implementation Guide - Campus Marketplace

## Overview

This document explains the complete PWA (Progressive Web App) implementation for Campus Marketplace. The system now supports professional install prompts, automatic updates, and mandatory update enforcement for critical bugs.

---

## What Was Implemented

### 1. **PWA Configuration System** (`src/utils/pwaConfig.js`)
Centralized configuration for all PWA-related settings:
- Install prompt behavior (delay, dismissal duration)
- Update checking intervals (6-hour checks)
- Cache management settings
- Analytics tracking
- Security settings
- Feature flags for turning features on/off
- Mandatory update configuration

**Key Features:**
- `isMandatoryUpdate()` - Checks if an update is mandatory
- `compareVersions()` - Semantic version comparison
- Production/Development detection

---

### 2. **Service Worker Enhancement** (`public/service-worker.js`)

**Improvements Made:**
- Added `CRITICAL_VERSIONS` array for mandatory updates
- Enhanced version checking with mandatory flag detection
- Improved update notification system
- Increased version check interval to 6 hours (from 30 minutes)
- Better error handling with `SW_ERROR` and `SW_ACTIVATED` messages

**How It Works:**
1. Service Worker checks for new versions periodically
2. If new version found, sends `NEW_VERSION_AVAILABLE` message to all clients
3. Message includes version, mandatory flag, and build hash
4. Clients listen and display appropriate UI

**Cache Strategy:**
- Static assets: Network-first (fresh cache on every load)
- Images: Network-first (fresh images when available)
- API calls: Never cached (always fresh)
- Old caches auto-cleaned on activation

---

### 3. **Service Worker Registration Module** (`src/serviceWorkerRegistration.js`)

**Exported Functions:**
- `registerServiceWorker()` - Registers the SW with update listeners
- `forceUpdate()` - Force check for updates
- `skipWaitingAndReload()` - Activate new SW immediately and reload
- `getServiceWorkerRegistration()` - Get current registration
- `postMessageToSW()` - Send messages to SW
- `listenToSWMessages()` - Listen for SW messages
- `unregister()` - Completely remove SW (only for dev)

**Registration Flow:**
```
1. index.js calls registerServiceWorker()
2. SW registers with update listener
3. Update checks happen every 6 hours automatically
4. On update found, listenForUpdates() notifies client
5. Client displays update prompt
```

---

### 4. **PWA Context** (`src/contexts/PWAContext.js`)

Global state management for PWA features:

**State Provided:**
- `isInstalled` - Whether app is installed
- `installPromptShown` - Whether install prompt has been shown
- `updateAvailable` - Whether update is ready
- `isMandatoryUpdate` - Whether update is mandatory
- `newVersion` - Version available
- `swRegistered` - Whether SW successfully registered
- `swError` - Any registration errors

**Responsibilities:**
- Registers service worker on mount
- Listens for install/app installed events
- Listens for update messages from SW
- Tracks installation status
- Manages installation prompt reset timer

**Usage:**
```javascript
import { usePWA } from './contexts/PWAContext'

function MyComponent() {
  const { isInstalled, updateAvailable, isMandatoryUpdate } = usePWA()
  
  return (
    <div>
      {isInstalled && <p>App Installed!</p>}
      {updateAvailable && <p>Update: {isMandatoryUpdate ? 'Required' : 'Optional'}</p>}
    </div>
  )
}
```

---

### 5. **useServiceWorkerUpdate Hook** (`src/hooks/useServiceWorkerUpdate.js`)

Custom React hook for update management in components:

**Returns:**
```javascript
{
  updateAvailable: boolean,
  isMandatory: boolean,
  newVersion: string,
  error: string|null,
  updateNow: function,   // Trigger update immediately
  dismiss: function      // Dismiss optional updates
}
```

**Features:**
- Listens for SW messages about updates
- Periodic update checking (every 6 hours)
- Cache clearing before reload
- Analytics integration
- Auto-update enforcement for mandatory updates
- 3-second timeout before forcing reload on mandatory updates

**Example:**
```javascript
const { updateAvailable, isMandatory, updateNow, dismiss } = useServiceWorkerUpdate()

if (updateAvailable) {
  return isMandatory ? 
    <MandatoryUpdateUI onUpdate={updateNow} /> :
    <OptionalUpdateUI onUpdate={updateNow} onDismiss={dismiss} />
}
```

---

### 6. **PWA Install Prompt** (`src/components/PwaInstallPrompt.js`)

Enhanced install prompt component:

**Features:**
- Smart delay before showing (configurable, default 10 seconds)
- Respects dismissal (7-day cooldown by default)
- iOS vs Android detection
- Platform-specific instructions
- Assumes app is already installed (checks `display-mode: standalone`)
- Integrated analytics tracking
- Better UX with timeout system

**When It Shows:**
1. On page load, checks if app not installed
2. Waits 10 seconds
3. Shows prompt at bottom/right (responsive)
4. User can install or dismiss
5. After dismiss, won't show for 7 days
6. After 7 days, prompts again

**Analytics Tracked:**
- `pwa_install_prompt_shown` - Prompt displayed
- `pwa_install_outcome` - User accepted/dismissed
- `pwa_install_dismissed` - Explicit dismiss action

---

### 7. **PWA Update Prompt** (`src/components/PWAUpdatePrompt.js`)

Modal dialog for update notifications:

**Features:**
- **Mandatory Updates:**
  - Cannot be dismissed
  - Central modal with red styling
  - Shows "Auto-updating in 5s..." countdown
  - Auto-updates after timeout
  - Prevents user from continuing without update
  
- **Optional Updates:**
  - Can be dismissed
  - Respects "Later" button
  - Blue styling
  - Non-intrusive

**Update Flow:**
1. Update is available from SW
2. Component shows modal
3. If mandatory: Auto-update after 5s countdown
4. If optional: User chooses "Update Now" or "Later"
5. On update: Clears caches and reloads
6. Analytics event sent

**Styling:**
- Backdrop blur (dark overlay)
- Smooth fade-in animation
- Success/warning colors based on type
- Responsive sizing
- Accessible buttons with proper states

---

### 8. **Version Management** (`src/utils/versionManager.js`)

Utility functions for version handling:

**Functions:**
- `getAppVersion()` - Current app version
- `compareVersions(a, b)` - Compare semantic versions
- `isNewerVersion(a, b)` - Check if A > B
- `isOlderVersion(a, b)` - Check if A < B
- `isCriticalVersion(v, list)` - Check if in critical list
- `getRemoteVersionInfo()` - Fetch from `version.json`
- `checkForUpdates()` - Check if update available

---

### 9. **Version File** (`public/version.json`)

Server endpoint for version information:

```json
{
  "version": "1.8.0",
  "buildHash": "v1-8-0",
  "releaseDate": "2026-02-26",
  "mandatory": false,
  "message": "Bug fixes and improvements",
  "changelog": ["Security improvements", "Performance optimization", "Bug fixes"]
}
```

**When To Update This File:**
1. On every production build
2. Set `mandatory: true` for critical bug fixes
3. Update `changelog` with release notes
4. Update `version` to match package.json
5. Update `buildHash` for cache busting

---

### 10. **Index.html Updates** (`public/index.html`)

Added PWA meta tags for proper support:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.webmanifest" />

<!-- iOS PWA Support -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Campus Marketplace" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
```

These tags enable:
- Web manifest support
- iOS home screen installation
- Custom app title on iOS
- Custom status bar styling
- App icon on home screen

---

### 11. **App Integration** (`src/App.js`)

Integrated PWA system into main app:

```javascript
import PWAUpdatePrompt from "./components/PWAUpdatePrompt"
import useServiceWorkerUpdate from "./hooks/useServiceWorkerUpdate"

function App() {
  const {
    updateAvailable,
    isMandatory,
    newVersion,
    updateNow,
    dismiss,
  } = useServiceWorkerUpdate()

  return (
    <PWAUpdatePrompt
      updateAvailable={updateAvailable}
      isMandatory={isMandatory}
      newVersion={newVersion}
      onUpdate={updateNow}
      onDismiss={dismiss}
    />
    // ... rest of app
  )
}
```

---

### 12. **Entry Point** (`src/index.js`)

Updated to:
- Register service worker in production only
- Wrap app with `PWAProvider`
- Proper provider nesting order

```javascript
// Register SW in production
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker()
}

// Wrap with PWAProvider for global state
root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <PWAProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </PWAProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
)
```

---

## How It Works - Complete Flow

### Installation Flow
```
User Opens App
    ↓
Router wraps app with PWAProvider
    ↓
PWAProvider registers Service Worker
    ↓
Check if app already installed (standalone mode)
    ↓
Listen for 'beforeinstallprompt' event
    ↓
Wait 10 seconds (configurable)
    ↓
Show Install Prompt (bottom of screen)
    ↓
User can "Install" or "Maybe Later"
    ↓
On Accept: Browser shows native install dialog
    ↓
On Install Complete: 'appinstalled' event fires
    ↓
Track analytics event
```

### Update Flow
```
Service Worker Active
    ↓
Every 6 hours: Check /version.json
    ↓
Compare versions
    ↓
If new version found:
    ├─ Check if mandatory (in CRITICAL_VERSIONS or version.json)
    ├─ Send message to client with update info
    │
    └─ Client receives message
       ├─ useServiceWorkerUpdate hook notifies component
       │
       └─ PWAUpdatePrompt displays:
          ├─ If Mandatory:
          │  ├─ Show "Critical Update Required"
          │  ├─ 5-second countdown
          │  └─ Auto-reload (cannot dismiss)
          │
          └─ If Optional:
             ├─ Show "Update Available"
             ├─ User can dismiss
             └─ Show again after 7 days
```

---

## Security Considerations

### ✅ Implemented Security

1. **No Auth Token Caching**
   - Service worker specifically avoids caching `/api/auth/` routes
   - Configured in both SW and pwaConfig

2. **API Route Protection**
   - API calls never cached
   - Always fresh data from server
   - Prevents stale data exposure

3. **Cache Versioning**
   - Each version has unique cache name
   - Old caches automatically deleted
   - No data leakage between versions

4. **CSP Compliance**
   - SW respects Content Security Policy
   - Safe message passing between worker and client
   - Configuration flag for strict compliance

5. **Cross-Origin Protection**
   - SW only caches same-origin requests
   - Cross-origin requests bypass cache
   - Prevents mixed content issues

---

## Deployment Checklist

### Before Building
1. ✅ Update `package.json` version
2. ✅ Update `public/version.json`:
   - Update `version` field
   - Update `buildHash` field
   - Update `changelog` field
   - Set `mandatory: true` if critical bug fix
   - Update `releaseDate`

3. ✅ Add to `CRITICAL_VERSIONS` array in `service-worker.js` if critical
4. ✅ Update `PWA_CONFIG.update.minimumRequiredVersion` if forcing update

### Build Process
```bash
npm run build
```

The build process should:
- Replace `BUILD_VERSION_PLACEHOLDER` in service-worker.js
- Replace `BUILD_HASH_PLACEHOLDER` in service-worker.js
- Generate optimized static assets

### After Deployment
1. ✅ Verify `version.json` is accessible at `/version.json`
2. ✅ Verify `manifest.webmanifest` is accessible
3. ✅ Verify Service Worker loads correctly
4. ✅ Test in Chrome DevTools: Application → Service Workers
5. ✅ Test install prompt appears after 10 seconds on fresh browser
6. ✅ Test update detection (modify version.json file)

---

## Configuration Guide

### Change Install Prompt Delay
Edit `src/utils/pwaConfig.js`:
```javascript
installPrompt: {
  delayBeforeShow: 5000, // Show after 5 seconds instead of 10
}
```

### Change Update Check Interval
Edit `src/utils/pwaConfig.js`:
```javascript
update: {
  checkInterval: 30 * 60 * 1000, // Check every 30 minutes
}
```

### Add Critical Version
Edit `src/utils/pwaConfig.js`:
```javascript
update: {
  criticalVersions: ['1.8.1', '1.8.2'], // Force update to these versions
}
```

Or edit `public/service-worker.js`:
```javascript
const CRITICAL_VERSIONS = ['1.8.1', '1.8.2']
```

### Disable Feature
Edit `src/utils/pwaConfig.js`:
```javascript
features: {
  updatePrompts: false,  // Disable update UI
  trackInstallation: false, // Disable analytics
}
```

---

## Troubleshooting

### Install Prompt Not Showing
**Reasons:**
1. App already installed (check standalone mode)
2. Dismissed in last 7 days
3. Service Worker not registered
4. Browser doesn't support PWA (test in Chrome)

**Solution:**
1. Check DevTools → Storage → Local Storage → `pwaPromptDismissed`
2. Delete that key to reset
3. Check DevTools → Console for SW errors
4. Verify manifest link in index.html

### Update Not Triggering
**Reasons:**
1. Service Worker not active
2. Version.json not accessible
3. Version numbers not changed
4. Browser cached version.json

**Solution:**
1. Check DevTools → Application → Service Workers
2. Verify `/version.json` returns correct JSON
3. Confirm version in JSON doesn't match package.json
4. Do hard refresh (Ctrl+Shift+R)
5. Clear cache: DevTools → Application → Clear Storage

### Mandatory Update Not Forcing
**Reasons:**
1. Version not in CRITICAL_VERSIONS
2. version.json.mandatory not set to true
3. User closed prompt before countdown

**Solution:**
1. Add version to `CRITICAL_VERSIONS` in service-worker.js
2. Set `"mandatory": true` in version.json
3. Increase timeout in PWAUpdatePrompt if needed

---

## Analytics Events Tracked

When `PWA_CONFIG.analytics.trackInstallation` is true:

```javascript
'pwa_install_prompt_shown' - Install prompt shown to user
'pwa_install_outcome' - { outcome: 'accepted'|'dismissed' }
'pwa_install_dismissed' - User clicked dismiss
'pwa_installed' - User successfully installed app

'pwa_update_available' - { version, is_mandatory }
'pwa_update_initiated' - { version, is_mandatory }
```

These are sent to Google Analytics if gtag is available.

---

## Browser Support

### ✅ Fully Supported
- Chrome 76+
- Edge 79+
- Samsung Internet 12+
- Opera 63+

### ✅ Partially Supported (iOS)
- iOS 13+ (Service Worker not fully supported)
- Install shows as "Add to Home Screen" instructions
- App works in web clip mode

### ⚠️ Limited Support
- Firefox 55+ (Service Worker OK, install limited)
- Safari (iOS still limited, macOS 16+)

---

## Files Changed/Created

### Created Files
- ✅ `src/utils/pwaConfig.js` - PWA configuration
- ✅ `src/utils/versionManager.js` - Version utilities
- ✅ `src/hooks/useServiceWorkerUpdate.js` - Update hook
- ✅ `src/contexts/PWAContext.js` - PWA state
- ✅ `src/components/PWAUpdatePrompt.js` - Update UI
- ✅ `public/version.json` - Version info

### Modified Files
- ✅ `src/serviceWorkerRegistration.js` - Complete rewrite
- ✅ `public/service-worker.js` - Enhanced with mandatory updates
- ✅ `src/components/PwaInstallPrompt.js` - Enhanced with better UX
- ✅ `src/App.js` - Added update prompt
- ✅ `src/index.js` - Register SW & add PWAProvider
- ✅ `public/index.html` - Added PWA meta tags

---

## Next Steps

### Recommended Enhancements
1. **Web Push Notifications** - Already prepared in SW, just need backend
2. **Background Sync** - Offline actions sync when online
3. **Periodic Background Sync** - Scheduled background updates
4. **Workbox Integration** - For advanced caching strategies
5. **Update Notification Badge** - Show badge on app icon

### Integration with CI/CD
1. Auto-update version in build process
2. Generate unique buildHash per deployment
3. Set mandatory flag based on commit tags
4. Deploy version.json to CDN with low TTL

---

## Support & Maintenance

### Regular Tasks
- Monthly: Review analytics for update adoption
- Per Release: Update version.json
- Per Critical Bug: Add to CRITICAL_VERSIONS
- Quarterly: Review PWA_CONFIG settings

### Monitoring
- Check DevTools Service Workers tab periodically
- Review update analytics
- Monitor user feedback about updates
- Test install flow monthly

---

**Implementation Complete! 🎉**

Your PWA is now production-ready with:
- ✅ Smart install prompts
- ✅ Automatic update checking
- ✅ Mandatory update support
- ✅ Professional UI
- ✅ Analytics integration
- ✅ Security-first design
- ✅ Scalable architecture
