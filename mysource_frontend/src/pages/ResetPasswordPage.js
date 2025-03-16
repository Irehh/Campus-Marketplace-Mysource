"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { FiArrowLeft, FiLock, FiCheck } from "react-icons/fi"
import toast from "react-hot-toast"

const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Invalid reset token")
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/auth/reset-password", { token, password })
      setSuccess(true)
      toast.success("Password reset successful!")

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (error) {
      console.error("Error resetting password:", error)
      setError(error.response?.data?.message || "Failed to reset password. The link may be invalid or expired.")
      toast.error("Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (error && !token) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            <p>{error}</p>
          </div>

          <Link to="/forgot-password" className="text-primary hover:underline">
            Request a new password reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Reset Your Password</h1>

      {success ? (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center text-green-500 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheck size={24} />
            </div>
          </div>

          <h2 className="text-xl font-semibold">Password Reset Successful!</h2>
          <p className="text-gray-600">Your password has been reset successfully.</p>
          <p className="text-gray-600">You will be redirected to the login page shortly.</p>

          <Link to="/login" className="block mt-4 text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">Please enter your new password below.</p>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                  disabled={loading}
                />
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                  disabled={loading}
                />
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-primary hover:underline text-sm flex items-center justify-center">
              <FiArrowLeft className="mr-2" />
              Back to Login
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default ResetPasswordPage

