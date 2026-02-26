/**
 * Version Management Utility
 * Provides utilities for version tracking and comparison
 */

/**
 * Get app version from package.json or config
 * @returns {string} - Version string (e.g., "1.8.0")
 */
export const getAppVersion = () => {
  // This will be replaced during build with actual version
  return process.env.REACT_APP_VERSION || '1.8.0'
}

/**
 * Compare two semantic versions
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

/**
 * Check if version A is newer than version B
 * @param {string} versionA
 * @param {string} versionB
 * @returns {boolean}
 */
export const isNewerVersion = (versionA, versionB) => {
  return compareVersions(versionA, versionB) > 0
}

/**
 * Check if version A is an older version than version B
 * @param {string} versionA
 * @param {string} versionB
 * @returns {boolean}
 */
export const isOlderVersion = (versionA, versionB) => {
  return compareVersions(versionA, versionB) < 0
}

/**
 * Check if version is in critical list
 * @param {string} version
 * @param {string[]} criticalVersions
 * @returns {boolean}
 */
export const isCriticalVersion = (version, criticalVersions = []) => {
  return criticalVersions.includes(version)
}

/**
 * Get version info from version.json
 * @returns {Promise<Object>}
 */
export const getRemoteVersionInfo = async () => {
  try {
    const response = await fetch('/version.json', { cache: 'no-cache' })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('[Version] Failed to fetch remote version:', error)
  }
  return null
}

/**
 * Check for available updates
 * @returns {Promise<Object|null>}
 */
export const checkForUpdates = async () => {
  const currentVersion = getAppVersion()
  const remoteInfo = await getRemoteVersionInfo()

  if (!remoteInfo) {
    return null
  }

  if (isNewerVersion(remoteInfo.version, currentVersion)) {
    return remoteInfo
  }

  return null
}

export default {
  getAppVersion,
  compareVersions,
  isNewerVersion,
  isOlderVersion,
  isCriticalVersion,
  getRemoteVersionInfo,
  checkForUpdates,
}
