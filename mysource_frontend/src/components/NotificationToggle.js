

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSupported,
} from "../utils/pushNotifications"
import toast from "react-hot-toast"

const NotificationToggle = () => {
  const { user } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if notifications are supported
  const isSupported = isPushNotificationSupported()

  // Check notification permission on mount
  useEffect(() => {
    if (isSupported && Notification.permission === "granted") {
      setNotificationsEnabled(true)
    }
  }, [isSupported])

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in your browser")
      return
    }

    setLoading(true)

    try {
      if (!notificationsEnabled) {
        // Enable notifications
        const { permission } = await requestNotificationPermission()

        if (permission) {
          await subscribeToPushNotifications(user.id)
          setNotificationsEnabled(true)
          toast.success("Push notifications enabled")
        } else {
          toast.error("Permission denied. Please enable notifications in your browser settings")
        }
      } else {
        // Disable notifications
        await unsubscribeFromPushNotifications()
        setNotificationsEnabled(false)
        toast.success("Push notifications disabled")
      }
    } catch (error) {
      console.error("Error toggling notifications:", error)
      toast.error("Failed to toggle notifications")
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) {
    return null // Don't show the toggle if not supported
  }

  return (
    <div className="flex items-center mt-4">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={notificationsEnabled}
          onChange={handleToggle}
          disabled={loading}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {loading ? "Loading..." : "Push Notifications"}
        </span>
      </label>
    </div>
  )
}

export default NotificationToggle

