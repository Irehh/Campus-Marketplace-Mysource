"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { FiArrowLeft, FiClock, FiCheck, FiX, FiAlertCircle } from "react-icons/fi"

const MyBidsPage = () => {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bids, setBids] = useState([])
  const [error, setError] = useState(null)

  const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${REACT_APP_API_URL}/api/bids/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data && Array.isArray(response.data.data)) {
          setBids(response.data.data)
        } else if (Array.isArray(response.data)) {
          setBids(response.data)
        } else {
          console.error("Unexpected response format:", response.data)
          setBids([])
        }
      } catch (error) {
        console.error("Error fetching bids:", error)
        setError("Failed to load your bids. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchBids()
    }
  }, [token, REACT_APP_API_URL])

  const getBidStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FiClock className="mr-1" size={12} /> Pending
          </span>
        )
      case "accepted":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FiCheck className="mr-1" size={12} /> Accepted
          </span>
        )
      case "rejected":
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FiX className="mr-1" size={12} /> Rejected
          </span>
        )
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FiAlertCircle className="mr-1" size={12} /> {status}
          </span>
        )
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/dashboard" className="flex items-center text-primary hover:underline">
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Bids</h1>
        <div className="h-1 w-20 bg-primary mt-2"></div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-medium mb-2">No Bids Yet</h2>
          <p className="text-gray-600 mb-6">You haven't placed any bids on gigs yet.</p>
          <Link
            to="/gigs"
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Browse Gigs
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="px-6 py-3 font-medium">Gig</th>
                  <th className="px-6 py-3 font-medium">Bid Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/gigs/${bid.gigId}`} className="text-primary hover:underline font-medium">
                        {bid.gig?.title || "Unknown Gig"}
                      </Link>
                      <p className="text-gray-500 text-sm truncate max-w-xs">
                        {bid.gig?.description?.substring(0, 60) || "No description"}
                        {bid.gig?.description?.length > 60 ? "..." : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-medium">₦{bid.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(bid.createdAt)}</td>
                    <td className="px-6 py-4">{getBidStatusBadge(bid.status)}</td>
                    <td className="px-6 py-4">
                      <Link to={`/gigs/${bid.gigId}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Gig
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBidsPage
