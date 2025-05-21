"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { formatCurrency, formatDate } from "../utils/format"
import { useAuth } from "../contexts/AuthContext"
import { FiCalendar, FiClock, FiEdit, FiTrash, FiUser, FiDollarSign, FiCheckCircle } from "react-icons/fi"
import Loader from "../components/Loader"
import BidForm from "../components/BidForm"
import BidList from "../components/BidList"
import ConfirmDialog from "../components/ConfirmDialog"
import toast from "react-hot-toast"
import CommentSection from "../components/CommentSection"
import SimilarGigs from "../components/SimilarGigs"

const GigDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, token } = useAuth()
  const [gig, setGig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBidForm, setShowBidForm] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmComplete, setShowConfirmComplete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    const fetchGig = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`/api/gigs/${id}`, {
          headers: isAuthenticated ? { Authorization: `Bearer ${token}` } : {},
        })
        setGig(response.data.data)

        // Check if user is authenticated and has a different campus than the gig
        if (
          isAuthenticated &&
          user &&
          user.campus &&
          response.data.data.campus &&
          user.campus !== response.data.data.campus
        ) {
          toast.warning(`This gig is from ${response.data.data.campus} campus.`)
        }
      } catch (error) {
        console.error("Error fetching gig:", error)
        setError(error.response?.data?.message || "Failed to load gig details")
      } finally {
        setLoading(false)
      }
    }

    fetchGig()
  }, [id, isAuthenticated, token, user])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`/api/gigs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Gig deleted successfully")
      navigate("/gigs")
    } catch (error) {
      console.error("Error deleting gig:", error)
      toast.error(error.response?.data?.message || "Failed to delete gig")
    } finally {
      setDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await axios.post(
        `/api/gigs/${id}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success("Gig marked as completed and payment released")
      // Refresh gig data
      const response = await axios.get(`/api/gigs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setGig(response.data)
    } catch (error) {
      console.error("Error completing gig:", error)
      toast.error(error.response?.data?.message || "Failed to complete gig")
    } finally {
      setCompleting(false)
      setShowConfirmComplete(false)
    }
  }

  if (loading) return <Loader />

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <Link to="/gigs" className="text-primary mt-2 inline-block">
            Back to Gigs
          </Link>
        </div>
      </div>
    )
  }

  if (!gig) return null

  const isOwner = isAuthenticated && user.id === gig.userId
  const isHired = isAuthenticated && user.id === gig.hiredUserId
  const canBid = isAuthenticated && !isOwner && gig.status === "open"
  const canComplete = isOwner && gig.status === "in_progress" && gig.paymentStatus === "escrow"

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold mb-1">
                {gig.description
                  ? gig.description.substring(0, 60) + (gig.description.length > 60 ? "..." : "")
                  : "Gig Detail"}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${
                    gig.status === "open"
                      ? "bg-green-100 text-green-800"
                      : gig.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : gig.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                  }`}
                >
                  {gig.status === "open"
                    ? "Open"
                    : gig.status === "in_progress"
                      ? "In Progress"
                      : gig.status === "completed"
                        ? "Completed"
                        : "Cancelled"}
                </span>
                <span className="px-2 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-medium">
                  {gig.category}
                </span>
                <span className="px-2 py-1 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium">
                  {gig.campus}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {isOwner && gig.status === "open" && (
                <>
                  <Link to={`/gigs/${id}/edit`} className="btn-secondary flex items-center text-sm">
                    <FiEdit className="mr-1" size={14} /> Edit
                  </Link>
                  <button onClick={() => setShowConfirmDelete(true)} className="btn-danger flex items-center text-sm">
                    <FiTrash className="mr-1" size={14} /> Delete
                  </button>
                </>
              )}
              {canComplete && (
                <button onClick={() => setShowConfirmComplete(true)} className="btn-success flex items-center text-sm">
                  <FiCheckCircle className="mr-1" size={14} /> Complete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Images */}
        {gig.images && gig.images.length > 0 && (
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {gig.images.map((image) => (
                <img
                  key={image.id}
                  src={image.url || "/placeholder.svg"}
                  alt={gig.title}
                  className="w-full h-48 object-cover rounded"
                />
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="whitespace-pre-line">{gig.description}</p>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-2xl font-bold text-primary">{gig.views || 0}</div>
                <div className="text-xs text-gray-500">Views</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-2xl font-bold text-primary">{gig.bids?.length || 0}</div>
                <div className="text-xs text-gray-500">Bids</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-2xl font-bold text-primary">{formatCurrency(gig.budget)}</div>
                <div className="text-xs text-gray-500">Budget</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <div className="text-2xl font-bold text-primary">{gig.duration || 0}</div>
                <div className="text-xs text-gray-500">Days</div>
              </div>
            </div>

            {/* Client/Freelancer Info */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">
                {isOwner ? "Your Gig" : `Posted by ${gig.client?.name || "Unknown"}`}
              </h2>
              <div className="flex items-center text-sm text-gray-600">
                <FiUser className="mr-1" />
                <span>{gig.client?.name || "Unknown"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <FiClock className="mr-1" />
                <span>Posted {formatDate(gig.createdAt)}</span>
              </div>
              {gig.deadline && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <FiCalendar className="mr-1" />
                  <span>Deadline: {formatDate(gig.deadline)}</span>
                </div>
              )}
            </div>

            {/* Hired Freelancer Info */}
            {gig.status === "in_progress" && gig.freelancer && (
              <div className="mt-6 p-3 bg-blue-50 rounded-md">
                <h3 className="font-semibold">Hired: {gig.freelancer.name}</h3>
                {isOwner && (
                  <p className="text-sm mt-1">
                    Contact the freelancer via the messaging system to discuss the project details.
                  </p>
                )}
                {isHired && (
                  <p className="text-sm mt-1">
                    You've been hired for this gig. Contact the client via the messaging system for details.
                  </p>
                )}
              </div>
            )}

            {/* Completed Info */}
            {gig.status === "completed" && (
              <div className="mt-6 p-3 bg-green-50 rounded-md">
                <h3 className="font-semibold">Completed on {formatDate(gig.completedAt)}</h3>
                <p className="text-sm mt-1">This gig has been marked as completed and payment has been released.</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-6">
              <CommentSection itemId={id} itemType="gig" />
            </div>
          </div>

          <div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold mb-4">Gig Details</h2>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-semibold text-primary">{formatCurrency(gig.budget)}</span>
                </div>

                {gig.duration && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Duration:</span>
                    <span>{gig.duration} days</span>
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${
                      gig.status === "open"
                        ? "bg-green-100 text-green-800"
                        : gig.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : gig.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {gig.status === "open"
                      ? "Open"
                      : gig.status === "in_progress"
                        ? "In Progress"
                        : gig.status === "completed"
                          ? "Completed"
                          : "Cancelled"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Campus:</span>
                  <span>{gig.campus}</span>
                </div>
              </div>

              {/* Bid Button */}
              {canBid && (
                <button
                  onClick={() => setShowBidForm(!showBidForm)}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  <FiDollarSign className="mr-1" /> {showBidForm ? "Cancel Bid" : "Place Bid"}
                </button>
              )}

              {/* Not Logged In */}
              {!isAuthenticated && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">You need to log in to place a bid</p>
                  <Link to="/login" className="btn-secondary w-full block">
                    Log In
                  </Link>
                </div>
              )}

              {/* Bid Form */}
              {showBidForm && (
                <div className="mt-4">
                  <BidForm
                    gigId={id}
                    onSuccess={() => {
                      setShowBidForm(false)
                      // Refresh gig data to show the new bid
                      axios
                        .get(`/api/gigs/${id}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        })
                        .then((response) => setGig(response.data))
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bids Section (for gig owner only) */}
        {isOwner && gig.bids && gig.bids.length > 0 && (
          <div className="p-4 border-t">
            <h2 className="text-lg font-semibold mb-4">Bids ({gig.bids.length})</h2>
            <BidList
              bids={gig.bids}
              gigId={id}
              gigStatus={gig.status}
              onBidAccepted={() => {
                // Refresh gig data after accepting a bid
                axios
                  .get(`/api/gigs/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  .then((response) => setGig(response.data))
              }}
            />
          </div>
        )}

        {/* Similar Gigs */}
        {!loading && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Similar Gigs</h2>
            <SimilarGigs currentGigId={id} category={gig?.category} campus={gig?.campus} />
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Gig"
        message="Are you sure you want to delete this gig? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        isLoading={deleting}
      />

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmComplete}
        title="Complete Gig"
        message="Are you sure you want to mark this gig as completed? This will release the payment to the freelancer and cannot be undone."
        confirmText="Complete"
        cancelText="Cancel"
        onConfirm={handleComplete}
        onCancel={() => setShowConfirmComplete(false)}
        isLoading={completing}
      />
    </div>
  )
}

export default GigDetailPage
