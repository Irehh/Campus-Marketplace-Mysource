# PWA Architecture & Code Map

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER / CLIENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  React Application                        │   │
│  │                                                            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  index.js (Entry Point)                             │ │   │
│  │  │  ├─ Registers Service Worker                        │ │   │
│  │  │  ├─ Wraps with PWAProvider                          │ │   │
│  │  │  └─ Renders App Component                           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                           ↓                               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  PWAProvider (Global Context)                       │ │   │
│  │  │  ├─ Checks if app installed                         │ │   │
│  │  │  ├─ Listens for 'beforeinstallprompt'              │ │   │
│  │  │  ├─ Listens for 'appinstalled'                     │ │   │
│  │  │  ├─ Manages install prompt state                    │ │   │
│  │  │  └─ Listens for SW messages (updates)              │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                           ↓                               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  App Component                                       │ │   │
│  │  │  ├─ useServiceWorkerUpdate() hook                  │ │   │
│  │  │  ├─ Renders <PWAInstallPrompt />                   │ │   │
│  │  │  └─ Renders <PWAUpdatePrompt />                    │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │           ↓                           ↓                   │   │
│  │  ┌────────────────────┐     ┌──────────────────────┐   │   │
│  │  │ PwaInstallPrompt   │     │ PWAUpdatePrompt      │   │   │
│  │  │ ├─ Smart timing    │     │ ├─ Mandatory mode    │   │   │
│  │  │ ├─ iOS detection   │     │ ├─ Optional mode     │   │   │
│  │  │ └─ Track dismiss   │     │ ├─ Countdown timer   │   │   │
│  │  │                    │     │ └─ Cache clearing    │   │   │
│  │  └────────────────────┘     └──────────────────────┘   │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Worker (Background)                             │   │
│  │                                                            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Install Event                                       │ │   │
│  │  │ ├─ Cache static assets                              │ │   │
│  │  │ ├─ Skip waiting for activation                      │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                           ↓                               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Activate Event                                      │ │   │
│  │  │ ├─ Clean up old caches                              │ │   │
│  │  │ ├─ Claim all clients                                │ │   │
│  │  │ ├─ Send SW_ACTIVATED message                        │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                           ↓                               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Periodic Check (Every 6 Hours)                      │ │   │
│  │  │ ├─ Fetch /version.json                              │ │   │
│  │  │ ├─ Compare versions                                 │ │   │
│  │  │ ├─ Check if mandatory                               │ │   │
│  │  │ └─ Send NEW_VERSION_AVAILABLE message              │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                           ↓                               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Fetch Event (Network-First Strategy)                │ │   │
│  │  │ ├─ Static assets: Network → Cache                   │ │   │
│  │  │ ├─ Images: Network → Cache                          │ │   │
│  │  │ ├─ API: Never cache                                 │ │   │
│  │  │ └─ Others: Network → Cache                          │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                           ↓                               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Push Event (Future Enhancement)                     │ │   │
│  │  │ ├─ Receive push notification                        │ │   │
│  │  │ ├─ Show notification UI                             │ │   │
│  │  │ └─ Track in analytics                               │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                           ↓                               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Message Event                                       │ │   │
│  │  │ ├─ Skip waiting on new version                       │ │   │
│  │  │ ├─ Check version endpoint                            │ │   │
│  │  │ └─ Clear all caches                                  │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Config & Utilities                                      │   │
│  │  ├─ pwaConfig.js (Central configuration)                │   │
│  │  ├─ serviceWorkerRegistration.js (SW API)               │   │
│  │  ├─ useServiceWorkerUpdate.js (React hook)              │   │
│  │  ├─ versionManager.js (Version utilities)               │   │
│  │  └─ PWAContext.js (Global state)                         │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────┬────────────────────────────────┘
                                │
                  ┌─────────────┴──────────────┐
                  │                             │
         ┌────────▼────────┐         ┌────────▼────────┐
         │  Server/CDN     │         │   Local Storage  │
         │                 │         │                  │
         │ ├─ /index.html  │         │ ├─ pwaPrompt     │
         │ ├─ /sw.js       │         │ │   Dismissed    │
         │ ├─ version.json │         │ ├─ pwaUpdate     │
         │ ├─ manifest     │         │ │   Dismissed    │
         │ └─ /api/*       │         │ └─ Cache data    │
         │                 │         │                  │
         └─────────────────┘         └──────────────────┘
```

---

## Data Flow Diagrams

### 1. Installation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens App                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ PWAProvider mounts           │
        │ Check: Is app installed?     │
        └──────┬───────────────────────┘
               │
        Yes◄───┴────►No
        │            │
        ▼            ▼
    Return     Listen for
    null       beforeinstallprompt
               │
               ├─ (Device Android/Desktop)
               │  Wait 10 seconds
               │  Show Install Prompt
               │  │
               │  ├─ User clicks Install
               │  │  │
               │  │  ▼
               │  │  Show browser native install
               │  │  │
               │  │  ├─ Accepted: appinstalled fires
               │  │  │  └─ Track analytics
               │  │  │
               │  │  └─ Dismissed: Nothing happens
               │  │
               │  └─ User clicks Later
               │     Save timestamp
               │     Don't show for 7 days
               │
               └─ (Device iOS)
                  Show iOS instructions
                  "Tap Share, then Add to Home Screen"
```

### 2. Update Detection Flow

```
┌──────────────────────────────────────────────────┐
│     Service Worker Active (Every 6 Hours)        │
└────────────┬─────────────────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Fetch /version.json│
    └────────┬───────────┘
             │
        ┌────┴─────┬──────────┐
        │           │          │
        │        Fail         │
        │        (offline)    │
        │        │           │
        ▼        ▼           ▼
    Success   No-op    Continue polling
      │
      ▼
  Compare versions
  Current: 1.8.0
  Remote:  1.8.1
      │
   Same◄────►Different
   │         │
   ▼         ▼
  Stop   Check mandatory flag
         or CRITICAL_VERSIONS
         │
      ┌──┴──┐
      │     │
    Yes     No
    │       │
    ▼       ▼
  Mandatory Optional
  │         │
  ▼         ▼
Send message with Send message with
isMandatory=true  isMandatory=false
    │                 │
    ▼                 ▼
  Client receives update message
  │
  ├─ useServiceWorkerUpdate captures
  ├─ PWAUpdatePrompt displays
  │
  ├─ If mandatory:
  │  ├─ Show countdown (5s)
  │  ├─ Prevent dismissal
  │  └─ Auto-reload
  │
  └─ If optional:
     ├─ User can dismiss
     ├─ User can update now
     └─ Won't show again for 7 days
```

### 3. Update Now Flow

```
┌────────────────────────────────┐
│  User clicks "Update Now"      │
└───────────┬────────────────────┘
            │
            ▼
     ┌─────────────┐
     │ setIsUpdating(true)
     │ Disable button
     └──────┬──────┘
            │
            ▼
  ┌──────────────────────┐
  │ getRegistrations()   │ (Service Worker API)
  │ Call update()        │
  └──────┬───────────────┘
         │
         ▼
  ┌──────────────────────┐
  │ caches.keys()        │ (Get all caches)
  │ Delete all caches    │ (Force fresh load)
  └──────┬───────────────┘
         │
         ▼
  ┌──────────────────────┐
  │ setTimeout 500ms     │
  │ window.location      │ (Browser reload)
  │ .reload()            │
  └──────┬───────────────┘
         │
         ▼
    ┌────────────────────┐
    │ Browser loads new  │
    │ version from SW    │
    │ with fresh cache   │
    └────────────────────┘
```

---

## File Dependencies Map

```
index.js
├─ serviceWorkerRegistration.js
│  └─ pwaConfig.js
├─ PWAContext.js (from contexts/)
│  └─ pwaConfig.js
├─ App.js
│  ├─ useServiceWorkerUpdate.js (from hooks/)
│  │  └─ pwaConfig.js
│  ├─ PWAUpdatePrompt.js (from components/)
│  │  └─ pwaConfig.js
│  └─ Layout.js
│     └─ PwaInstallPrompt.js (from components/)
│        └─ pwaConfig.js

index.html
├─ manifest.webmanifest (link tag)
├─ version.json (fetched by SW)
└─ service-worker.js (link in manifest OR direct register)

service-worker.js
├─ version.json (checked periodically)
└─ /api/* routes (never cached)
```

---

## State Management Flow

```
┌─ PWAContext (Global) ───────────────────────────────┐
│                                                      │
│ ┌─ isInstalled: boolean                             │
│ │  └─ From: display-mode:standalone check           │
│ │                                                   │
│ ┌─ installPromptShown: boolean                      │
│ │  └─ From: beforeinstallprompt event               │
│ │                                                   │
│ ├─ updateAvailable: boolean                         │
│ │  └─ From: SW NEW_VERSION_AVAILABLE message        │
│ │                                                   │
│ ├─ isMandatoryUpdate: boolean                       │
│ │  └─ From: version.mandatory || CRITICAL_VERSIONS  │
│ │                                                   │
│ ├─ newVersion: string                               │
│ │  └─ From: version.json                            │
│ │                                                   │
│ ├─ swRegistered: boolean                            │
│ │  └─ From: registerServiceWorker() result          │
│ │                                                   │
│ └─ swError: string | null                           │
│    └─ From: registration error                      │
│                                                      │
└──────────────────────────────────────────────────────┘
          ↓
   Consumed by components:
   - PwaInstallPrompt (isInstalled, installPromptShown)
   - PWAUpdatePrompt (updateAvailable, isMandatoryUpdate)
   - useServiceWorkerUpdate hook (all state)

┌─ useServiceWorkerUpdate Hook (Local) ───────────────┐
│                                                      │
│ Manages update logic & returns:                     │
│ - updateAvailable: boolean                          │
│ - isMandatory: boolean                              │
│ - newVersion: string                                │
│ - error: string | null                              │
│ - updateNow: function                               │
│ - dismiss: function                                 │
│                                                      │
│ Listens to:                                         │
│ - Service Worker messages                           │
│ - Periodic update checks                            │
│ - Analytics events                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
          ↓
   Consumed by:
   - App.js → PWAUpdatePrompt component
```

---

## Message Passing System

```
┌─────────────────────────────────────────────────────────────┐
│           Service Worker  ←→  React Components              │
└─────────────────────────────────────────────────────────────┘

Service Worker → Client (postMessage):
├─ NEW_VERSION_AVAILABLE
│  ├─ version: "1.8.1"
│  ├─ isMandatory: true
│  ├─ buildHash: "v1-8-1"
│  └─ message: "Security update"
│
├─ SW_ACTIVATED
│  ├─ version: "1.8.1"
│  └─ buildHash: "v1-8-1"
│
├─ SW_ERROR
│  └─ message: "Error details"
│
└─ Update check results
   └─ Includes version comparison

Client → Service Worker (postMessage):
├─ SKIP_WAITING
│  └─ Tells SW to activate new version immediately
│
├─ CHECK_VERSION
│  └─ Manually trigger version check
│
└─ CLEAR_ALL_CACHES
   └─ Clear all stored caches
```

---

## Configuration Hierarchy

```
pwaConfig.js (Source of Truth)
│
├─ Feeds → serviceWorkerRegistration.js
├─ Feeds → PWAContext.js
├─ Feeds → useServiceWorkerUpdate.js
├─ Feeds → PwaInstallPrompt.js
└─ Feeds → PWAUpdatePrompt.js

Also used in:
├─ versionManager.js (utility)
└─ Analytics tracking (if enabled)

Runtime configuration sources:
├─ pwaConfig.js (compile-time)
├─ localStorage (user preferences)
├─ version.json (server-driven)
└─ CRITICAL_VERSIONS in SW (compile-time)
```

---

## Lifecycle Diagrams

### App Initialization Lifecycle

```
1. App starts
2. ReactDOM renders with providers
3. PWAProvider mounts
   │
   ├─ registerServiceWorker() called
   ├─ SW registers (if production)
   ├─ Check if already installed
   ├─ Set up event listeners
   │  ├─ beforeinstallprompt
   │  ├─ appinstalled
   │  └─ message (from SW)
   │
4. App.js mounts
   │
   ├─ useServiceWorkerUpdate() hook runs
   ├─ Set up SW message listener
   ├─ Set up periodic update check
   │
5. Render UI
   │
   ├─ <PwaInstallPrompt /> (if not installed)
   ├─ <PWAUpdatePrompt /> (if update available)
   └─ Rest of app

Forever:
   Every 6 hours:
   └─ Service Worker checks /version.json
      └─ If new, sends message to all clients
         └─ Components re-render with new state
```

### Service Worker Lifecycle

```
1. Browser detects service-worker.js
2. Download & parse
3. Install event
   ├─ Cache static assets
   ├─ self.skipWaiting()
4. Activate event (if waiting)
   ├─ Clean old caches
   ├─ self.clients.claim()
   ├─ Send "SW_ACTIVATED" to all clients
5. Ready to intercept network
   ├─ Fetch events
   ├─ Push events
   ├─ Message events
6. Periodic version check
   ├─ Every 6 hours
   ├─ Fetch /version.json
   ├─ If new version, notify clients
7. Continue until unregistered

Update path:
1. User opens app
2. SW ready (old version)
3. Check /version.json
4. New version found
5. Install event fires (new SW)
6. Wait in queue (old SW still active)
7. Send "NEW_VERSION_AVAILABLE"
8. User clicks update OR mandatory timeout
9. Skip waiting + reload
10. New SW takes over
11. Activate event fires
12. Old caches deleted
```

---

## Error Handling Paths

```
Service Worker Registration Error
├─ Caught in registerServiceWorker()
├─ Set swError state
├─ Log to console
├─ App continues without PWA features
└─ User can still use app

Update Check Failure
├─ Network error when fetching /version.json
├─ Handled in SW fetch event
├─ Returns default {version: "unknown"}
├─ No error shown to user
└─ Retries in 6 hours

Cache Operation Failure
├─ Caching fails (storage full?)
├─ Silently continues
├─ App doesn't break
└─ Fallback to network

Update Prompt Error
├─ Caught in PWAUpdatePrompt
├─ Button disabled temporarily
├─ Error logged
├─ User can retry or dismiss
└─ App continues

Analytics Tracking Error
├─ Fails in trackUpdateEvent()
├─ Caught & logged
├─ Doesn't affect app
└─ No impact on update process
```

---

## Performance Considerations

```
Initial Load Impact:
├─ +2KB: pwaConfig.js
├─ +3KB: serviceWorkerRegistration.js
├─ +4KB: useServiceWorkerUpdate hook
├─ +3KB: PWAContext.js
├─ +5KB: PwaInstallPrompt.js
├─ +6KB: PWAUpdatePrompt.js
├─ +2KB: versionManager.js
└─ Total: ~25KB (7KB gzipped)

Service Worker Impact:
├─ Async registration (non-blocking)
├─ Background version checks (6-hourly)
├─ Passive fetch interception
├─ No latency impact

Cache Impact:
├─ SW file itself: ~15KB
├─ Icons cache: ~500KB (one-time)
├─ Images cache: Dynamic (user content)
├─ Static asset cache: ~2MB (app content)
└─ Total cacheable: ~2.5MB (depends on usage)

Memory Impact:
├─ PWAProvider: ~1KB state
├─ useServiceWorkerUpdate: ~500B state
├─ Message listeners: Negligible
└─ Total: ~2KB RAM overhead
```

---

## Testing Checklist

```
Installation Flow
├─ [ ] Prompt shows after 10 seconds on new browser
├─ [ ] iOS shows custom instructions
├─ [ ] Android shows native install
├─ [ ] Dismiss works and shows again after 7 days
├─ [ ] Already installed app doesn't show prompt
└─ [ ] Analytics event "pwa_install_outcome" fires

Update Detection
├─ [ ] SW checks version.json every 6 hours
├─ [ ] New version detected correctly
├─ [ ] Version comparison works (1.8.0 < 1.8.1)
├─ [ ] Message sent to all clients
└─ [ ] Hook receives and updates state

Update UI
├─ [ ] Optional update shows "Update Now" & "Later"
├─ [ ] Mandatory update shows countdown
├─ [ ] Mandatory auto-updates after 5 seconds
├─ [ ] Can't dismiss mandatory update
├─ [ ] Optional can be dismissed
└─ [ ] Dismiss resets after 7 days

Performance
├─ [ ] Page load time < 100ms slower
├─ [ ] SW registers without blocking
├─ [ ] No memory leaks
├─ [ ] Cache operations don't timeout
└─ [ ] Updates don't cause lag

Security
├─ [ ] Auth tokens not cached
├─ [ ] API calls always fresh
├─ [ ] Old caches cleaned up
├─ [ ] CSP headers respected
└─ [ ] XSS/CSRF attacks prevented
```

---

## Quick Reference

### Key Files by Purpose

**Configuration:**
- `src/utils/pwaConfig.js` - All settings

**Core Logic:**
- `src/serviceWorkerRegistration.js` - SW management
- `src/contexts/PWAContext.js` - Global state
- `src/hooks/useServiceWorkerUpdate.js` - Update logic

**UI Components:**
- `src/components/PwaInstallPrompt.js` - Install UI
- `src/components/PWAUpdatePrompt.js` - Update UI

**Service Worker:**
- `public/service-worker.js` - Background worker
- `public/version.json` - Version endpoint

**Integration:**
- `src/index.js` - Enable PWA
- `src/App.js` - Show update prompt
- `public/index.html` - Meta tags & manifest

---

**For detailed information about each component, see PWA_IMPLEMENTATION.md**
