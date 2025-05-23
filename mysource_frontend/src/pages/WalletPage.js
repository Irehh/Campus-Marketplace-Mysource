"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { FiArrowDownLeft, FiArrowUpRight, FiCreditCard, FiClock, FiDollarSign, FiInfo } from "react-icons/fi"
import { WALLET_CONSTANTS } from "../config"

const WalletPage = () => {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [error, setError] = useState(null)

  const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${REACT_APP_API_URL}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setWallet(response.data.wallet)
        setRecentTransactions(response.data.recentTransactions || [])
        setError(null)
      } catch (error) {
        console.error("Error fetching wallet:", error)
        setError("Failed to load wallet information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchWallet()
    }
  }, [token, REACT_APP_API_URL])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <FiArrowDownLeft className="text-green-500" />
      case "withdrawal":
        return <FiArrowUpRight className="text-red-500" />
      case "escrow":
        return <FiClock className="text-blue-500" />
      case "release":
        return <FiArrowDownLeft className="text-green-500" />
      case "refund":
        return <FiArrowUpRight className="text-orange-500" />
      case "fee":
      case "withdrawal_fee":
        return <FiDollarSign className="text-gray-500" />
      default:
        return <FiDollarSign className="text-gray-500" />
    }
  }

  const getTransactionStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "escrow":
        return "Escrow"
      case "release":
        return "Payment"
      case "refund":
        return "Refund"
      case "fee":
        return "Fee"
      case "withdrawal_fee":
        return "Withdrawal Fee"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <div className="text-center">
          <Link to="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>
        <div className="h-1 w-20 bg-primary mt-2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Available Balance</h2>
            <FiCreditCard className="text-primary text-xl" />
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-primary">₦{wallet?.balance?.toLocaleString() || "0"}</p>
          </div>
          <div className="flex space-x-2 mt-4">
            <Link
              to="/wallet/deposit"
              className="flex-1 bg-green-600 text-white text-center py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Deposit
            </Link>
            <Link
              to="/wallet/withdraw"
              className="flex-1 bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Withdraw
            </Link>
          </div>
        </div>

        {/* Pending Balance Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Balance</h2>
            <FiClock className="text-yellow-500 text-xl" />
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-yellow-600">₦{wallet?.pendingBalance?.toLocaleString() || "0"}</p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Funds in escrow or processing. These will be available once the transaction is completed.
          </p>
        </div>

        {/* Total Earned Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Total Earned</h2>
            <FiDollarSign className="text-green-500 text-xl" />
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-green-600">₦{wallet?.totalEarned?.toLocaleString() || "0"}</p>
          </div>
          <Link to="/transactions" className="text-primary hover:underline text-sm block mt-4">
            View all transactions
          </Link>
        </div>
      </div>

      {/* Wallet Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <FiInfo className="text-primary mr-2" />
          <h2 className="text-lg font-semibold">Wallet Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Deposits</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Minimum deposit amount: ₦{WALLET_CONSTANTS.MINIMUM_DEPOSIT.toLocaleString()}</li>
              <li>• Deposits are processed instantly</li>
              <li>• Multiple payment methods available</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Withdrawals</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Minimum withdrawal amount: ₦{WALLET_CONSTANTS.MINIMUM_WITHDRAWAL.toLocaleString()}</li>
              <li>• Withdrawal fee: ₦{WALLET_CONSTANTS.WITHDRAWAL_FEE.toLocaleString()}</li>
              <li>• Processing time: 1-3 business days</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Link to="/transactions" className="text-primary hover:underline text-sm">
            View all
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-0">
                    <td className="py-4 flex items-center">
                      <span className="mr-2">{getTransactionIcon(transaction.type)}</span>
                      {getTransactionTypeLabel(transaction.type)}
                    </td>
                    <td className="py-4 font-medium">₦{transaction.amount.toLocaleString()}</td>
                    <td className="py-4 text-gray-500">{formatDate(transaction.createdAt)}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getTransactionStatusClass(transaction.status)}`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 text-gray-500 text-sm">{transaction.reference || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletPage
