"use client"

import { useState } from "react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import toast from "react-hot-toast"

const MessageForm = ({ receiverId, productId, businessId, onMessageSent }) => {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    try {
      await axios.post(
        "/api/messages",
        {
          receiverId,
          content: message,
          productId,
          businessId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      toast.success("Message sent successfully!")
      setMessage("")
      if (onMessageSent) onMessageSent()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message here..."
        className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
        rows="3"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  )
}

export default MessageForm

