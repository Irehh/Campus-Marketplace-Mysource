"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi"
import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from "../config"

const TransactionsPage = () => {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  })
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    startDate: "",
    endDate: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true)

      let queryParams = `limit=${pagination.pageSize}&page=${page}`

      if (filters.type && filters.type !== "all") {
        queryParams += `&type=${filters.type}`
      }

      if (filters.status && filters.status !== "all") {
        queryParams += `&status=${filters.status}`
      }

      if (filters.startDate) {
        queryParams += `&startDate=${filters.startDate}`
      }

      if (filters.endDate) {
        queryParams += `&endDate=${filters.endDate}`
      }

      const response = await axios.get(`${REACT_APP_API_URL}/api/wallet/transactions?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setTransactions(response.data.transactions || [])
      setPagination(
        response.data.pagination || {
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      )
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchTransactions(1)
    }
  }, [token, filters]) // Re-fetch when filters change

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage)
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transaction History</h1>
          <div className="h-1 w-20 bg-primary mt-2"></div>
        </div>
        <div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
          >
            <FiFilter className="mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter Transactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TRANSACTION_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions found</p>
            <Link to="/wallet" className="text-primary hover:underline mt-2 inline-block">
              Return to Wallet
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Reference</th>
                    <th className="pb-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
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
                      <td className="py-4 text-gray-500 text-sm">{transaction.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} transactions
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`flex items-center px-3 py-1 rounded-md ${
                      pagination.page === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FiChevronLeft className="mr-1" /> Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`flex items-center px-3 py-1 rounded-md ${
                      pagination.page === pagination.totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Next <FiChevronRight className="ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TransactionsPage
