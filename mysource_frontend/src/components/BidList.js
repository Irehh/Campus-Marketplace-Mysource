"use client"

import { useState } from "react"
import axios from "axios"
import { formatCurrency, formatDate } from "../utils/format"
import { useAuth } from "../contexts/AuthContext"
import toast from "react-hot-toast"
import ConfirmDialog from "./ConfirmDialog"
import { FiCheckCircle, FiXCircle, FiUser, FiClock, FiDollarSign } from "react-icons/fi"

const BidList = ({ bids, gigId, gigStatus, onBidAccepted }) => {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showConfirmAccept, setShowConfirmAccept] = useState(false)
  const [showConfirmReject, setShowConfirmReject] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)

  const handleAcceptClick = (bid) => {
    setSelectedBid(bid)
    setShowConfirmAccept(true)
  }

  const handleRejectClick = (bid) => {
    setSelectedBid(bid)
    setShowConfirmReject(true)
  }

  const handleAcceptBid = async () => {
    setLoading(true)
    try {
      await axios.post(
        `/api/bids/${selectedBid.id}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success("Bid accepted successfully!")
      if (onBidAccepted) onBidAccepted()
    } catch (error) {
      console.error("Error accepting bid:", error)
      toast.error(error.response?.data?.message || "Failed to accept bid")
    } finally {
      setLoading(false)
      setShowConfirmAccept(false)
      setSelectedBid(null)
    }
  }

  const handleRejectBid = async () => {
    setLoading(true)
    try {
      await axios.post(
        `/api/bids/${selectedBid.id}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success("Bid rejected successfully!")
      if (onBidAccepted) onBidAccepted()
    } catch (error) {
      console.error("Error rejecting bid:", error)
      toast.error(error.response?.data?.message || "Failed to reject bid")
    } finally {
      setLoading(false)
      setShowConfirmReject(false)
      setSelectedBid(null)
    }
  }

  if (!bids || bids.length === 0) {
    return <p className="text-gray-500 text-center py-4">No bids yet.</p>
  }

  return (
    <div className="space-y-4">
      {bids.map((bid) => (
        <div
          key={bid.id}
          className={`border rounded-lg overflow-hidden ${
            bid.status === "accepted"
              ? "border-green-200 bg-green-50"
              : bid.status === "rejected"
                ? "border-gray-200 bg-gray-50 opacity-75"
                : "border-blue-100 bg-blue-50"
          }`}
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <FiUser className="mr-2 text-gray-600" />
                  <span className="font-medium">{bid.bidder?.name || "Anonymous"}</span>
                  {bid.status === "accepted" && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                      <FiCheckCircle className="mr-1" size={12} />
                      Accepted
                    </span>
                  )}
                  {bid.status === "rejected" && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                      <FiXCircle className="mr-1" size={12} />
                      Rejected
                    </span>
                  )}
                </div>
                <div className="mt-2 text-gray-700">{bid.proposal}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-primary text-xl font-bold">
                  <FiDollarSign size={18} className="mr-1" />
                  {formatCurrency(bid.amount)}
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <FiClock className="mr-1" size={14} />
                  {bid.deliveryTime} day{bid.deliveryTime !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-4">
              <span>Bid placed {formatDate(bid.createdAt)}</span>
            </div>

            {/* Actions for pending bids */}
            {bid.status === "pending" && gigStatus === "open" && (
              <div className="mt-3 flex justify-end space-x-2">
                <button
                  onClick={() => handleRejectClick(bid)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAcceptClick(bid)}
                  className="px-2 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Confirm Accept Dialog */}
      <ConfirmDialog
        isOpen={showConfirmAccept}
        title="Accept Bid"
        message={`Are you sure you want to accept this bid from ${selectedBid?.bidder?.name || "this freelancer"}? 
        This will mark the gig as in progress and reject all other bids.`}
        confirmText="Accept Bid"
        cancelText="Cancel"
        onConfirm={handleAcceptBid}
        onCancel={() => setShowConfirmAccept(false)}
        isLoading={loading}
      />

      {/* Confirm Reject Dialog */}
      <ConfirmDialog
        isOpen={showConfirmReject}
        title="Reject Bid"
        message={`Are you sure you want to reject this bid from ${selectedBid?.bidder?.name || "this freelancer"}?`}
        confirmText="Reject Bid"
        cancelText="Cancel"
        onConfirm={handleRejectBid}
        onCancel={() => setShowConfirmReject(false)}
        isLoading={loading}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}

export default BidList
