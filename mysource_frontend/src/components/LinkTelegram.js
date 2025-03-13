"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { FaTelegram } from "react-icons/fa"

const LinkTelegram = () => {
  const { user, linkTelegramAccount } = useAuth()
  const [telegramId, setTelegramId] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await linkTelegramAccount(telegramId)
      alert("Telegram account linked successfully!")
    } catch (error) {
      console.error("Error linking Telegram account:", error)
      alert("Failed to link Telegram account. Please try again.")
    }
  }

  if (user?.telegramId) {
    return (
      <div className="flex items-center text-green-600">
        <FaTelegram className="mr-2" />
        Telegram account linked
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="telegramId" className="label">
          Telegram ID
        </label>
        <input
          type="text"
          id="telegramId"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          className="input"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary flex items-center justify-center">
        <FaTelegram className="mr-2" />
        Link Telegram Account
      </button>
    </form>
  )
}

export default LinkTelegram

