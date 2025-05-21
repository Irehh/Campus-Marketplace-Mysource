"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { FiCheck, FiX, FiLoader } from "react-icons/fi"

const VerifyPaymentPage = () => {
  const { token } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("pending") // pending, success, failed
  const [transaction, setTransaction] = useState(null)
  const [error, setError] = useState(null)

  const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true)

        // Get reference from URL query params
        const params = new URLSearchParams(location.search)
        const reference = params.get("reference")

        if (!reference) {
          setError("Payment reference not found")
          setStatus("failed")
          return
        }

        // Verify payment with backend
        const response = await axios.get(`${REACT_APP_API_URL}/wallet/deposit/verify?reference=${reference}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setTransaction(response.data.transaction)
        setStatus("success")
      } catch (error) {
        console.error("Error verifying payment:", error)
        setError(error.response?.data?.message || "Failed to verify payment. Please contact support.")
        setStatus("failed")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      verifyPayment()
    }
  }, [token, location.search, REACT_APP_API_URL])

  // Redirect to wallet after 5 seconds on success
  useEffect(() => {
    let timer
    if (status === "success") {
      timer = setTimeout(() => {
        navigate("/wallet")
      }, 5000)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [status, navigate])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          {loading ? (
            <div className="py-8">
              <FiLoader className="animate-spin text-primary text-4xl mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
              <p className="text-gray-600">Please wait while we verify your payment...</p>
            </div>
          ) : status === "success" ? (
            <div className="py-8">
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiCheck className="text-green-600 text-3xl" />
              </div>
              <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                Your payment of ₦{transaction?.amount?.toLocaleString()} has been successfully processed and added to
                your wallet.
              </p>
              <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">₦{transaction?.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium">{transaction?.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(transaction?.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">You will be redirected to your wallet in 5 seconds...</p>
              <Link
                to="/wallet"
                className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                Go to Wallet
              </Link>
            </div>
          ) : (
            <div className="py-8">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiX className="text-red-600 text-3xl" />
              </div>
              <h2 className="text-xl font-bold mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">{error || "There was an issue processing your payment."}</p>
              <div className="flex flex-col space-y-3">
                <Link
                  to="/wallet/deposit"
                  className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
                >
                  Try Again
                </Link>
                <Link
                  to="/wallet"
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Return to Wallet
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyPaymentPage
