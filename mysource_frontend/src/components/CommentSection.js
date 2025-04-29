

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"
import { FiSend, FiTrash2 } from "react-icons/fi"

const CommentSection = ({ itemId, itemType }) => {
  const { user, isAuthenticated, token } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/comments/${itemType}/${itemId}`)
        setComments(response.data)
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [itemId, itemType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    setSubmitting(true)
    try {
      const response = await axios.post(
        "/api/comments",
        {
          content: newComment,
          itemId,
          itemType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setComments([...comments, response.data])
      setNewComment("")
    } catch (error) {
      console.error("Error posting comment:", error)
      alert("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return

    try {
      await axios.delete(`/api/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setComments(comments.filter((comment) => comment.id !== commentId))
    } catch (error) {
      console.error("Error deleting comment:", error)
      alert("Failed to delete comment")
    }
  }

  if (loading) {
    return <div className="text-center py-2 text-xs">Loading comments...</div>
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Comments ({comments.length})</h3>

      {comments.length > 0 ? (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-md p-2 text-xs">
              <div className="flex justify-between items-start">
                <div className="font-medium">{comment.user.name}</div>
                {user && comment.userId === user.id && (
                  <button onClick={() => handleDelete(comment.id)} className="text-red-500 hover:text-red-700">
                    <FiTrash2 size={12} />
                  </button>
                )}
              </div>
              <p className="mt-1">{comment.content}</p>
              <div className="text-gray-500 text-[10px] mt-1">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-xs">No comments yet. Be the first to comment!</p>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mt-2 flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-grow text-xs p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-primary text-white p-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
          >
            <FiSend size={14} />
          </button>
        </form>
      ) : (
        <p className="text-gray-500 text-xs italic">Please sign in to leave a comment.</p>
      )}
    </div>
  )
}

export default CommentSection

