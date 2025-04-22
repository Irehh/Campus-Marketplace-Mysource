"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import { FiArrowLeft, FiBell, FiSave, FiAlertCircle } from "react-icons/fi"
import { BsTelegram } from "react-icons/bs"
import toast from "react-hot-toast"

const NotificationSettingsPage = () => {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    notifyByTelegram: true,
    notificationKeywords: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        setLoading(true)
        const response = await api.get("/api/auth/notification-settings")

        setSettings({
          notifyByTelegram: response.data.notifyByTelegram ?? true,
          notificationKeywords: response.data.notificationKeywords ?? "",
        })
      } catch (error) {
        console.error("Error fetching notification settings:", error)
        setError("Failed to load notification settings")
        toast.error("Failed to load notification settings")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchUserSettings()
    }
  }, [token])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      await api.put("/api/auth/notification-settings", settings)
      setSuccess("Notification settings updated successfully")
      toast.success("Notification settings updated successfully")
    } catch (error) {
      console.error("Error updating notification settings:", error)
      setError("Failed to update notification settings")
      toast.error("Failed to update notification settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="text-primary hover:underline flex items-center mr-4">
          <FiArrowLeft className="mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Telegram Notifications */}
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center mb-4">
                <BsTelegram className="text-blue-500 mr-2" size={20} />
                <h3 className="text-lg font-semibold">Telegram Notifications</h3>
              </div>

              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="notifyByTelegram"
                  name="notifyByTelegram"
                  checked={settings.notifyByTelegram}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="notifyByTelegram" className="ml-2 block text-sm text-gray-700">
                  Receive notifications via Telegram
                </label>
              </div>

              <p className="text-sm text-gray-600">
                {user?.telegramChatId
                  ? "Your Telegram account is linked. You will receive notifications about new messages and products matching your keywords."
                  : "You need to link your Telegram account in your profile to receive Telegram notifications."}
              </p>

              {!user?.telegramChatId && (
                <Link to="/profile" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Go to profile to link Telegram
                </Link>
              )}
            </div>

            {/* Keyword Notifications */}
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-3">
                <FiBell className="text-primary mr-2" />
                Keyword Notifications
              </h3>

              <div className="mb-2">
                <label htmlFor="notificationKeywords" className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Keywords (comma separated)
                </label>
                <textarea
                  id="notificationKeywords"
                  name="notificationKeywords"
                  value={settings.notificationKeywords}
                  onChange={handleChange}
                  rows="3"
                  placeholder="e.g. laptop, phone, textbook, furniture"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-sm text-gray-500">
                  You will be notified when new products matching these keywords are posted. Separate keywords with
                  commas.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                <FiSave className="mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NotificationSettingsPage

