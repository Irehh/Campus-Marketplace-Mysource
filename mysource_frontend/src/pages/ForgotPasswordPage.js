"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { FiArrowLeft, FiMail } from "react-icons/fi"
import toast from "react-hot-toast"

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/auth/request-password-reset", { email })
      setSubmitted(true)
      toast.success("If your email is registered, you will receive a password reset link")
    } catch (error) {
      console.error("Error requesting password reset:", error)
      toast.error("Failed to process request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Reset Your Password</h1>

      {submitted ? (
        <div className="text-center space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
            <p>If your email is registered, you will receive a password reset link shortly.</p>
            <p className="mt-2 text-sm">Please check your inbox and spam folder.</p>
          </div>

          <Link to="/login" className="text-primary hover:underline flex items-center justify-center">
            <FiArrowLeft className="mr-2" />
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-primary hover:underline text-sm">
              Back to Login
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default ForgotPasswordPage

