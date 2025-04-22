import { useState } from "react"
import axios from "axios"
import { REACT_APP_API_URL } from "../config"
import toast from "react-hot-toast"
import { BsTelegram } from "react-icons/bs"
import { FiAlertCircle } from "react-icons/fi"

const LinkTelegram = ({ user, onUpdate }) => {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const botUsername = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || "your_bot_username"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")

      // Log the request details to console
      console.log("Sending Telegram verification request:", {
        code,
        endpoint: `${REACT_APP_API_URL}/api/telegram/verify-code`, // Fixed endpoint URL
      })

      const response = await axios.post(
        `${REACT_APP_API_URL}/api/telegram/verify-code`, // Fixed endpoint URL to match backend route
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      console.log("Telegram verification response:", response.data)

      setSuccess(response.data.message || "Telegram account linked successfully!")
      toast.success("Telegram account linked successfully!")
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error("Telegram verification error:", err)
      console.error("Error response:", err.response?.data)

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to link Telegram account. Please try again.",
      )
      toast.error(error || "Failed to link Telegram account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <BsTelegram className="text-blue-500 mr-2" />
        Link Telegram Account
      </h3>

      {user?.telegramChatId ? (
        <div className="mb-4">
          <p className="text-green-600 font-medium">✅ Your Telegram account is linked!</p>
          <p className="text-sm text-gray-600 mt-1">You will receive notifications about your listings and messages.</p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-3">
            Link your Telegram account to receive notifications about your listings and messages.
          </p>

          <div className="bg-blue-50 p-3 rounded-md mb-4">
            <h4 className="font-medium text-blue-700 mb-2">How to link your account:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>
                Search for <span className="font-mono bg-gray-100 px-1 rounded">@{botUsername}</span> on Telegram
              </li>
              <li>Start a chat with the bot by clicking "Start" or sending "/start"</li>
              <li>The bot will send you a 6-digit verification code</li>
              <li>Enter that code below to complete the linking process</li>
            </ol>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3 text-sm">
              <div className="flex items-center text-red-700">
                <FiAlertCircle className="mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3 text-sm text-green-700">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter verification code"
                className="border rounded px-3 py-2 w-full sm:w-auto"
                maxLength={6}
                required
              />
              <button
                type="submit"
                disabled={loading || !code}
                className={`px-4 py-2 rounded font-medium ${
                  loading ? "bg-gray-300 text-gray-700" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? "Linking..." : "Link Account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default LinkTelegram

