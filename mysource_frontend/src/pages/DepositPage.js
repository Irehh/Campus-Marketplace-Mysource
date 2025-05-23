"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { FiArrowLeft, FiCreditCard, FiAlertCircle } from "react-icons/fi"
import { WALLET_CONSTANTS } from "../config"
import toast from "react-hot-toast"

const DepositPage = () => {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState(null)

  const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setWallet(response.data.wallet)
      } catch (error) {
        console.error("Error fetching wallet:", error)
        setError("Failed to load wallet information. Please try again later.")
      }
    }

    if (token) {
      fetchWallet()
    }
  }, [token, REACT_APP_API_URL])

  const handleAmountChange = (e) => {
    setAmount(e.target.value)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate amount
    const depositAmount = Number(amount)
    if (isNaN(depositAmount) || depositAmount < WALLET_CONSTANTS.MINIMUM_DEPOSIT) {
      setError(`Minimum deposit amount is ₦${WALLET_CONSTANTS.MINIMUM_DEPOSIT.toLocaleString()}`)
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(
        `${REACT_APP_API_URL}/api/wallet/deposit`,
        { amount: depositAmount },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Redirect to Paystack payment page
      if (response.data && response.data.authorization_url) {
        window.location.href = response.data.authorization_url
      } else {
        toast.error("Failed to initialize payment. Please try again.")
      }
    } catch (error) {
      console.error("Error initializing deposit:", error)
      setError(error.response?.data?.message || "Failed to initialize deposit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const presetAmounts = [1000, 2000, 5000, 10000, 20000]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link to="/wallet" className="flex items-center text-primary hover:underline">
            <FiArrowLeft className="mr-2" /> Back to Wallet
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <FiCreditCard className="text-green-600 text-2xl" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6">Deposit Funds</h1>

          {wallet && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-xl font-bold text-primary">₦{wallet.balance.toLocaleString()}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-start">
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₦)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter amount"
                min={WALLET_CONSTANTS.MINIMUM_DEPOSIT}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum deposit amount: ₦{WALLET_CONSTANTS.MINIMUM_DEPOSIT.toLocaleString()}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Select</p>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((presetAmount) => (
                  <button
                    key={presetAmount}
                    type="button"
                    onClick={() => setAmount(presetAmount.toString())}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-md text-sm"
                  >
                    ₦{presetAmount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition-colors font-medium"
              disabled={loading}
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Payments are securely processed by Paystack. Your card details are not stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DepositPage
