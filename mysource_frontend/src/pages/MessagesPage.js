

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { formatDistanceToNow } from "date-fns"

const MessagesPage = () => {
  const { token, user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifyByTelegram, setNotifyByTelegram] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("/api/messages", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Group messages by conversation
        const messages = response.data
        const conversationMap = new Map()

        messages.forEach((message) => {
          const otherUser = message.senderId === user.id ? message.receiver : message.sender
          const conversationKey = otherUser.id

          if (!conversationMap.has(conversationKey)) {
            conversationMap.set(conversationKey, {
              otherUser,
              lastMessage: message,
              unreadCount: message.receiverId === user.id && !message.read ? 1 : 0,
              productId: message.productId,
              businessId: message.businessId,
            })
          } else {
            const conversation = conversationMap.get(conversationKey)
            if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
              conversation.lastMessage = message
            }
            if (message.receiverId === user.id && !message.read) {
              conversation.unreadCount += 1
            }
          }
        })

        setConversations(Array.from(conversationMap.values()))

        // Get notification settings
        const userResponse = await axios.get("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setNotifyByTelegram(userResponse.data.notifyByTelegram)
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [token, user.id])

  const toggleNotifications = async () => {
    try {
      const response = await axios.put(
        "/api/messages/notifications",
        {
          notifyByTelegram: !notifyByTelegram,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setNotifyByTelegram(response.data.notifyByTelegram)
    } catch (error) {
      console.error("Error toggling notifications:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="flex items-center">
          <span className="mr-2 text-sm">Telegram notifications:</span>
          <button
            onClick={toggleNotifications}
            className={`relative inline-flex items-center h-6 rounded-full w-11 ${notifyByTelegram ? "bg-primary" : "bg-gray-300"}`}
          >
            <span
              className={`inline-block w-4 h-4 transform transition ${notifyByTelegram ? "translate-x-6" : "translate-x-1"} rounded-full bg-white`}
            />
          </button>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">You don't have any messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Link
              key={conversation.otherUser.id}
              to={`/messages/${conversation.otherUser.id}`}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{conversation.otherUser.name}</div>
                  <div className="text-sm text-gray-600 truncate max-w-xs">
                    {conversation.lastMessage.senderId === user.id ? "You: " : ""}
                    {conversation.lastMessage.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {conversation.unreadCount > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full px-2 py-1 mb-1">
                      {conversation.unreadCount}
                    </span>
                  )}
                  {conversation.productId && <span className="text-xs bg-gray-100 px-2 py-1 rounded">Product</span>}
                  {conversation.businessId && <span className="text-xs bg-gray-100 px-2 py-1 rounded">Business</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MessagesPage

