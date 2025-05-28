"use client"

import { useState } from "react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import toast from "react-hot-toast"

const BidForm = ({ gigId, onSuccess }) => {
  const { token } = useAuth()
  const [amount, setAmount] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("")
  const [proposal, setProposal] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!amount || !deliveryTime || !proposal) {
      setError("All fields are required")
      return
    }

    setLoading(true)
    try {
      await axios.post(
        `/api/bids/${gigId}`,
        {
          gigId,
          amount: Number.parseFloat(amount),
          deliveryTime: Number.parseInt(deliveryTime),
          proposal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      toast.success("Bid submitted successfully!")
      setAmount("")
      setDeliveryTime("")
      setProposal("")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error submitting bid:", error)
      setError(error.response?.data?.message || "Failed to submit bid. Please try again.")
      toast.error(error.response?.data?.message || "Failed to submit bid")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Bid Amount (NGN)
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter your bid amount"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Time (days)
        </label>
        <input
          type="number"
          id="deliveryTime"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          placeholder="Number of days to complete"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
          min="1"
          step="1"
          required
        />
      </div>

      <div>
        <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 mb-1">
          Your Proposal
        </label>
        <textarea
          id="proposal"
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          placeholder="Describe how you'll complete this gig"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
          rows="3"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Bid"}
      </button>
    </form>
  )
}

export default BidForm
