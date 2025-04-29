

import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { formatDistanceToNow } from "date-fns"

const ConversationPage = () => {
  const { userId } = useParams()
  const { token, user } = useAuth()
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await axios.get(`/api/messages/conversation/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setMessages(response.data)

        // Get other user details
        if (response.data.length > 0) {
          const message = response.data[0]
          const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId

          const userResponse = await axios.get(`/api/auth/user/${otherUserId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          setOtherUser(userResponse.data)
        }
      } catch (error) {
        console.error("Error fetching conversation:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()

    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversation, 10000)

    return () => clearInterval(interval)
  }, [token, userId, user.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await axios.post(
        "/api/messages",
        {
          receiverId: userId,
          content: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setMessages([...messages, response.data])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <div>
            <Link to="/messages" className="text-primary hover:underline">
              &larr; Back to Messages
            </Link>
            <h1 className="text-xl font-bold mt-1">{otherUser?.name || "User"}</h1>
          </div>

          {messages.length > 0 && messages[0].productId && (
            <Link
              to={`/products/${messages[0].productId}`}
              className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
            >
              View Product
            </Link>
          )}

          {messages.length > 0 && messages[0].businessId && (
            <Link
              to={`/businesses/${messages[0].businessId}`}
              className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
            >
              View Business
            </Link>
          )}
        </div>

        {/* Messages */}
        <div className="p-4 h-[60vh] overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderId === user.id
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-white border rounded-bl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${message.senderId === user.id ? "text-primary-100" : "text-gray-500"}`}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={sending}
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark disabled:opacity-50"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ConversationPage

