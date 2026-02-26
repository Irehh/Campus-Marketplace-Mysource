/**
 * PWA Update Prompt Component
 * Shows when a new version is available
 * Can be mandatory or optional
 */

import { useState, useEffect } from 'react'
import { FiRefreshCw, FiX, FiAlertTriangle } from 'react-icons/fi'
import PWA_CONFIG from '../utils/pwaConfig'

/**
 * PWA Update Prompt Component
 * @param {Object} props
 * @param {boolean} props.updateAvailable - Whether update is available
 * @param {boolean} props.isMandatory - Whether update is mandatory
 * @param {string} props.newVersion - New version number
 * @param {Function} props.onUpdate - Callback when user clicks update
 * @param {Function} props.onDismiss - Callback when user closes prompt (for optional updates)
 */
const PWAUpdatePrompt = ({
  updateAvailable,
  isMandatory,
  newVersion,
  onUpdate,
  onDismiss,
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAutoUpdateWarning, setShowAutoUpdateWarning] = useState(isMandatory)
  const [autoUpdateCountdown, setAutoUpdateCountdown] = useState(5)

  /**
   * Handle update button click
   */
  const handleUpdate = async () => {
    setIsUpdating(true)

    // Track update action
    if (PWA_CONFIG.analytics.trackUpdates && window.gtag) {
      window.gtag('event', 'pwa_update_initiated', {
        version: newVersion,
        is_mandatory: isMandatory,
        timestamp: new Date().toISOString(),
      })
    }

    if (onUpdate) {
      await onUpdate()
    }
  }

  /**
   * Handle dismiss button click
   */
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss()
    }
  }

  // Auto-update for mandatory updates after countdown
  useEffect(() => {
    if (!isMandatory || !showAutoUpdateWarning) return

    const timer = setInterval(() => {
      setAutoUpdateCountdown((prev) => {
        if (prev <= 1) {
          handleUpdate()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isMandatory, showAutoUpdateWarning])

  if (!updateAvailable) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md mx-4 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {isMandatory ? (
              <div className="bg-red-100 rounded-full p-3 mr-3">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
            ) : (
              <div className="bg-blue-100 rounded-full p-3 mr-3">
                <FiRefreshCw className="text-blue-600" size={24} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold">
                {isMandatory ? 'Critical Update Required' : 'Update Available'}
              </h3>
              {newVersion && (
                <p className="text-sm text-gray-500">Version {newVersion}</p>
              )}
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          )}
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            {isMandatory
              ? 'A critical security update is available and must be installed to continue using the app. Your app will refresh automatically.'
              : 'A new version of Campus Marketplace is available. Update now for the latest features and improvements.'}
          </p>

          {isMandatory && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-700">
                <strong>Auto-updating in {autoUpdateCountdown}s...</strong>
              </p>
              <p className="text-xs text-red-600 mt-1">
                This update cannot be dismissed for security reasons
              </p>
            </div>
          )}
        </div>

        {/* What's Changed */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6 max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-700 mb-2">What's New:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Security improvements</li>
            <li>• Performance optimization</li>
            <li>• Bug fixes and enhancements</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isMandatory && (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isUpdating}
            >
              Later
            </button>
          )}
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 ${
              isUpdating ? 'bg-green-500 opacity-75' : 'bg-blue-600 hover:bg-blue-700'
            } ${isMandatory && !isUpdating ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {isUpdating ? (
              <>
                <FiRefreshCw className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              <>
                <FiRefreshCw size={18} />
                Update Now
              </>
            )}
          </button>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          {isMandatory
            ? 'Your app will refresh automatically'
            : 'You can update now or later from Settings'}
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default PWAUpdatePrompt
