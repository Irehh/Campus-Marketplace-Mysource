

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import toast from "react-hot-toast"

const VerifyEmailPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/verify-email/${token}`)

        // Auto-login the user
        if (response.data.token && response.data.user) {
          await login(response.data.token, response.data.user)
          toast.success("Email verified successfully! You are now logged in.")
          navigate("/")
        } else {
          setSuccess(true)
        }
      } catch (error) {
        console.error("Verification error:", error)
        setError(error.response?.data?.message || "Failed to verify email. The link may be invalid or expired.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token, navigate, login])

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Email Verification</h1>

      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          <p className="mt-2">Verifying your email...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p>{error}</p>
          <div className="mt-4">
            <p>You can request a new verification link:</p>
            <Link to="/resend-verification" className="btn btn-primary w-full mt-2">
              Resend Verification Email
            </Link>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          <p>Your email has been verified successfully!</p>
          <Link to="/login" className="btn btn-primary w-full mt-4">
            Log In
          </Link>
        </div>
      )}
    </div>
  )
}

export default VerifyEmailPage
