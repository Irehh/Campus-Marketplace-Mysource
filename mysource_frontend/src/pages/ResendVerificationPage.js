

import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import toast from "react-hot-toast"

const ResendVerificationPage = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email) {
      setError("Email is required")
      return
    }

    setLoading(true)

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/resend-verification`, { email })
      setSuccess(true)
      toast.success("Verification email sent. Please check your inbox.")
    } catch (error) {
      console.error("Error resending verification:", error)
      setError(error.response?.data?.message || "Failed to send verification email")
      toast.error("Failed to send verification email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Resend Verification Email</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {success ? (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          <p>Verification email sent! Please check your inbox and spam folder.</p>
          <p className="mt-2">
            Return to{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Sending..." : "Resend Verification Email"}
          </button>

          <p className="mt-4 text-center">
            Remember your password?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}

export default ResendVerificationPage
