"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { FaTelegram } from "react-icons/fa"
import { FiX, FiCheck, FiInfo } from "react-icons/fi"
import axios from "axios"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"

const LinkTelegram = () => {
  const { user, token, updateProfile } = useAuth()
  const [telegramId, setTelegramId] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [, setGeneratedCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState("")

  const generateVerificationCode = () => {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleInitiateLink = async (e) => {
    e.preventDefault()
    if (!telegramId.trim()) return

    setLoading(true)
    setError("")

    try {
      // Generate a verification code
      const code = generateVerificationCode()
      setGeneratedCode(code)

      // Store the code temporarily (in a real app, you'd store this server-side)
      localStorage.setItem("telegramVerificationCode", code)

      // Format the Telegram ID (remove @ if present)
      const formattedId = telegramId.startsWith("@") ? telegramId : `@${telegramId}`

      // Send verification message to the Telegram user
      const response = await axios.post(
        "/api/telegram/send-verification",
        {
          telegramId: formattedId,
          code,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Show verification step
      setShowVerification(true)
      toast.success("Verification code sent to your Telegram account")
    } catch (error) {
      console.error("Error initiating Telegram link:", error)
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send verification code. Please check the Telegram ID and make sure you've started a conversation with our bot."

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndLink = async (e) => {
    e.preventDefault()

    // Get stored code
    const storedCode = localStorage.getItem("telegramVerificationCode")

    if (verificationCode !== storedCode) {
      toast.error("Invalid verification code")
      return
    }

    setLoading(true)

    try {
      // Link the account
      await axios.post(
        "/api/auth/link-telegram",
        { telegramId: telegramId.startsWith("@") ? telegramId.substring(1) : telegramId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Clear verification data
      localStorage.removeItem("telegramVerificationCode")
      setShowVerification(false)
      setVerificationCode("")
      setTelegramId("")
      setError("")

      // Update user data
      if (updateProfile) {
        await updateProfile({})
      }

      toast.success("Telegram account linked successfully!")
    } catch (error) {
      console.error("Error linking Telegram account:", error)
      toast.error("Failed to link Telegram account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Telegram account?")) {
      return
    }

    setDisconnecting(true)

    try {
      await axios.post(
        "/api/auth/unlink-telegram",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update user data
      if (updateProfile) {
        await updateProfile({})
      }

      toast.success("Telegram account disconnected successfully")
    } catch (error) {
      console.error("Error disconnecting Telegram account:", error)
      toast.error("Failed to disconnect Telegram account")
    } finally {
      setDisconnecting(false)
    }
  }

  if (user?.telegramId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center text-green-600">
          <FaTelegram className="mr-2" />
          <span>Telegram account linked: @{user.telegramId}</span>
        </div>

        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex items-center text-red-500 hover:text-red-700 text-sm"
        >
          <FiX className="mr-1" />
          {disconnecting ? "Disconnecting..." : "Disconnect Telegram Account"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!showVerification ? (
        <form onSubmit={handleInitiateLink} className="space-y-4">
          <div>
            <label htmlFor="telegramId" className="label">
              Telegram Username
            </label>
            <div className="flex">
              <input
                type="text"
                id="telegramId"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="e.g. @username"
                className="input flex-grow"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter your Telegram username or ID to receive notifications</p>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary flex items-center justify-center" disabled={loading}>
            <FaTelegram className="mr-2" />
            {loading ? "Sending Code..." : "Send Verification Code"}
          </button>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-xs text-blue-700">
            <p className="font-medium">Important:</p>
            <p>Before linking, you must first start a conversation with our bot on Telegram:</p>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>
                Search for <strong>@YourBotUsername</strong> on Telegram
              </li>
              <li>
                Start a conversation by sending the <strong>/start</strong> command
              </li>
              <li>Then return here to complete the linking process</li>
            </ol>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndLink} className="space-y-4">
          <div>
            <label htmlFor="verificationCode" className="label">
              Verification Code
            </label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="input"
              placeholder="Enter 6-digit code"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code sent to your Telegram account</p>
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="btn btn-primary flex items-center justify-center" disabled={loading}>
              <FiCheck className="mr-2" />
              {loading ? "Verifying..." : "Verify & Link"}
            </button>
            <button
              type="button"
              onClick={() => setShowVerification(false)}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link to="/telegram-setup" className="text-sm text-primary hover:underline flex items-center">
          <FiInfo className="mr-1" size={14} />
          How to set up your Telegram bot
        </Link>
      </div>
    </div>
  )
}

export default LinkTelegram

