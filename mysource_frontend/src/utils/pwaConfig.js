/**
 * PWA Configuration
 * Centralized settings for PWA behavior, versioning, and features
 */

const PWA_CONFIG = {
  // Service Worker registration settings
  serviceWorker: {
    // Path to service worker file
    path: '/service-worker.js',
    // Scope - which pages the SW controls
    scope: '/',
  },

  // Install prompt settings
  installPrompt: {
    // Delay before showing install prompt (ms)
    delayBeforeShow: 10000,
    // Storage key for dismissal
    storageKey: 'pwaPromptDismissed',
    // How long to wait before showing again after dismiss (days)
    dismissalDuration: 7,
  },

  // Update settings
  update: {
    // Check for updates interval (ms) - every 6 hours
    checkInterval: 6 * 60 * 60 * 1000,
    // Critical bug versions that force update
    criticalVersions: [],
    // Minimum version that triggers mandatory update
    minimumRequiredVersion: '1.8.0',
  },

  // Caching settings
  cache: {
    // Static assets cache name
    staticName: 'campus-marketplace-static',
    // Images cache name
    imagesName: 'campus-marketplace-images',
    // API response cache (minutes)
    apiCacheDuration: 5,
    // Maximum image cache size (items)
    maxImageCaches: 100,
  },

  // Analytics & Tracking
  analytics: {
    // Track PWA installation
    trackInstallation: true,
    // Track update events
    trackUpdates: true,
    // Track version changes
    trackVersions: true,
  },

  // Security settings
  security: {
    // Don't cache auth tokens
    noCachePatterns: ['/api/auth/', '/api/user/'],
    // CSP compliance
    respectCSP: true,
  },

  // Feature flags
  features: {
    // Enable push notifications
    pushNotifications: true,
    // Enable background sync
    backgroundSync: true,
    // Enable offline support
    offlineSupport: true,
    // Enable update prompts
    updatePrompts: true,
    // Force update on critical bugs
    forceUpdateOnCritical: true,
  },

  // Development vs Production
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

/**
 * Check if update is mandatory/critical
 * @param {string} currentVersion - Current app version
 * @param {string} availableVersion - Available update version
 * @returns {boolean} - Whether update is mandatory
 */
export const isMandatoryUpdate = (currentVersion, availableVersion) => {
  if (!PWA_CONFIG.features.forceUpdateOnCritical) {
    return false
  }

  // Check if in critical versions list
  if (PWA_CONFIG.update.criticalVersions.includes(availableVersion)) {
    return true
  }

  // Check if available version is newer than minimum required
  return compareVersions(availableVersion, PWA_CONFIG.update.minimumRequiredVersion) > 0
}

/**
 * Compare semantic versions
 * @param {string} versionA
 * @param {string} versionB
 * @returns {number} - 1 if A > B, -1 if A < B, 0 if equal
 */
export const compareVersions = (versionA, versionB) => {
  const partsA = versionA.split('.').map(Number)
  const partsB = versionB.split('.').map(Number)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const a = partsA[i] || 0
    const b = partsB[i] || 0

    if (a > b) return 1
    if (a < b) return -1
  }

  return 0
}

export default PWA_CONFIG
