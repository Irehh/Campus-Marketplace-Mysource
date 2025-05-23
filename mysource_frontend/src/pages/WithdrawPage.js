"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { FiArrowLeft, FiAlertCircle, FiCheck } from "react-icons/fi"
import { WALLET_CONSTANTS } from "../config"
import toast from "react-hot-toast"

const WithdrawPage = () => {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [banks, setBanks] = useState([])
  const [formData, setFormData] = useState({
    amount: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  })
  const [error, setError] = useState(null)
  const [accountVerified, setAccountVerified] = useState(false)

  const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch wallet
        const walletResponse = await axios.get(`${REACT_APP_API_URL}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setWallet(walletResponse.data.wallet)

        // Fetch banks
        const banksResponse = await axios.get(`${REACT_APP_API_URL}/api/wallet/banks`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBanks(banksResponse.data || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load necessary information. Please try again later.")
      }
    }

    if (token) {
      fetchData()
    }
  }, [token, REACT_APP_API_URL])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Reset verification if bank or account number changes
    if (name === "bankCode" || name === "accountNumber") {
      setAccountVerified(false)
      setFormData((prev) => ({
        ...prev,
        accountName: "",
      }))
    }

    setError(null)
  }

  const verifyAccount = async () => {
    if (!formData.bankCode || !formData.accountNumber) {
      setError("Please select a bank and enter an account number")
      return
    }

    try {
      setVerifying(true)
      const response = await axios.post(
        `${REACT_APP_API_URL}/api/wallet/verify-account`,
        {
          bankCode: formData.bankCode,
          accountNumber: formData.accountNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setFormData((prev) => ({
        ...prev,
        accountName: response.data.account_name,
      }))
      setAccountVerified(true)
      toast.success("Account verified successfully")
    } catch (error) {
      console.error("Error verifying account:", error)
      setError(error.response?.data?.message || "Failed to verify account. Please check the details and try again.")
      setAccountVerified(false)
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!accountVerified) {
      setError("Please verify your account details first")
      return
    }

    // Validate amount
    const withdrawalAmount = Number(formData.amount)
    if (isNaN(withdrawalAmount) || withdrawalAmount < WALLET_CONSTANTS.MINIMUM_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ₦${WALLET_CONSTANTS.MINIMUM_WITHDRAWAL.toLocaleString()}`)
      return
    }

    // Check if user has enough balance (including fee)
    const totalAmount = withdrawalAmount + WALLET_CONSTANTS.WITHDRAWAL_FEE
    if (wallet && wallet.balance < totalAmount) {
      setError(
        `Insufficient funds. You need ₦${totalAmount.toLocaleString()} (including ₦${WALLET_CONSTANTS.WITHDRAWAL_FEE.toLocaleString()} withdrawal fee)`,
      )
      return
    }

    try {
      setLoading(true)
      await axios.post(`${REACT_APP_API_URL}/api/wallet/withdraw`, formData, { headers: { Authorization: `Bearer ${token}` } })

      toast.success("Withdrawal request submitted successfully")
      navigate("/wallet")
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      setError(error.response?.data?.message || "Failed to process withdrawal. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link to="/wallet" className="flex items-center text-primary hover:underline">
            <FiArrowLeft className="mr-2" /> Back to Wallet
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Withdraw Funds</h1>

          {wallet && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <p className="text-sm text-gray-600">Available Balance</p>
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
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter amount"
                min={WALLET_CONSTANTS.MINIMUM_WITHDRAWAL}
                required
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Minimum: ₦{WALLET_CONSTANTS.MINIMUM_WITHDRAWAL.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Fee: ₦{WALLET_CONSTANTS.WITHDRAWAL_FEE.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700 mb-1">
                Bank
              </label>
              <select
                id="bankCode"
                name="bankCode"
                value={formData.bankCode}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select Bank</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter account number"
                  maxLength={10}
                  required
                />
                <button
                  type="button"
                  onClick={verifyAccount}
                  disabled={verifying || !formData.bankCode || !formData.accountNumber}
                  className="bg-blue-600 text-white px-3 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {verifying ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>

            {accountVerified && (
              <div className="mb-4">
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <div className="flex items-center border border-green-300 bg-green-50 rounded-md px-3 py-2">
                  <FiCheck className="text-green-500 mr-2" />
                  <span className="text-green-800">{formData.accountName}</span>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-3 rounded-md mb-6">
              <p className="text-sm text-yellow-800">
                Withdrawals are processed within 1-3 business days. A fee of ₦
                {WALLET_CONSTANTS.WITHDRAWAL_FEE.toLocaleString()} will be deducted from your withdrawal amount.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition-colors font-medium"
              disabled={loading || !accountVerified}
            >
              {loading ? "Processing..." : "Withdraw Funds"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default WithdrawPage
