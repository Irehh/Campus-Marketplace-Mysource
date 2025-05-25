"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { REACT_APP_API_URL } from "../config"

const VerifyEmailPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("verifying") // verifying, success, error
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Invalid verification link")
        return
      }

      try {
        setStatus("verifying")
        setMessage("Verifying your email...")

        const response = await axios.get(`${REACT_APP_API_URL}/api/auth/verify-email/${token}`, {
          timeout: 10000, // 10 second timeout
        })

        if (response.data.success) {
          setStatus("success")
          setMessage("Email verified successfully! Redirecting to login...")

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login", { replace: true })
          }, 3000)
        } else {
          setStatus("error")
          setMessage(response.data.message || "Email verification failed")
        }
      } catch (error) {
        console.error("Email verification error:", error)
        setStatus("error")

        if (error.code === "ECONNABORTED") {
          setMessage("Request timeout. Please try again.")
        } else if (error.response?.data?.message) {
          setMessage(error.response.data.message)
        } else if (error.response?.status === 404) {
          setMessage("Invalid or expired verification link")
        } else {
          setMessage("Email verification failed. Please try again.")
        }
      }
    }

    verifyEmail()
  }, [token, navigate])

  const handleRetryClick = () => {
    window.location.reload()
  }

  const handleLoginClick = () => {
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === "verifying" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-900 mb-4">Email Verified!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <button
                  onClick={handleLoginClick}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Login
                </button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-4">Verification Failed</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <button
                    onClick={handleRetryClick}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleLoginClick}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
