import { useState } from "react";
import axios from "axios";
import { formatCurrency, formatDate } from "../utils/format";
import { FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const BidList = ({ bids, gigId, gigStatus, onBidAccepted }) => {
  const { token } = useAuth();
  const [acceptingBid, setAcceptingBid] = useState(null);

  const handleAcceptBid = async (bidId) => {
    setAcceptingBid(bidId);
    try {
      await axios.post(
        `/api/gigs/${gigId}/bids/${bidId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Bid accepted successfully!");
      onBidAccepted(); // Refresh gig data
    } catch (error) {
      console.error("Error accepting bid:", error);
      toast.error(error.response?.data?.message || "Failed to accept bid");
    } finally {
      setAcceptingBid(null);
    }
  };

  if (!bids || bids.length === 0) {
    return <p className="text-gray-500">No bids yet.</p>;
  }

  return (
    <div className="space-y-4">
      {bids.map((bid) => (
        <div key={bid.id} className="p-4 bg-gray-50 rounded-md border">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{bid.freelancer?.name || "Unknown"}</p>
              <p className="text-sm text-gray-600">{formatCurrency(bid.amount)}</p>
              <p className="text-xs text-gray-500">Placed on {formatDate(bid.createdAt)}</p>
              <p className="text-sm mt-2">{bid.description}</p>
            </div>
            {gigStatus === "open" && (
              <button
                onClick={() => handleAcceptBid(bid.id)}
                disabled={acceptingBid === bid.id}
                className={`btn-primary flex items-center text-sm ${
                  acceptingBid === bid.id ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FiCheckCircle className="mr-1" size={14} />
                {acceptingBid === bid.id ? "Accepting..." : "Accept Bid"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BidList;