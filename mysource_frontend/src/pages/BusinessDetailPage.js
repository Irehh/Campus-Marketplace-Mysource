import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import MessageForm from "../components/MessageForm"
import SuggestedBusinesses from "../components/SuggestedBusinesses"
import {
  FiEdit2,
  FiTrash2,
  FiMessageSquare,
  FiMapPin,
  FiLink,
  FiPhone,
  FiClock,
  FiMessageCircle,
  FiEye,
  FiAlertTriangle,
  FiShield,
  FiHeart,
} from "react-icons/fi"
import { BsTelegram } from "react-icons/bs"
import { formatDistanceToNow } from "date-fns"
import CommentSection from "../components/CommentSection"
import toast from "react-hot-toast"
import { useFavorites } from "../contexts/FavoritesContext"
import { SOCIAL_MEDIA_LINKS } from "../config" // Import SOCIAL_MEDIA_LINKS

const BusinessDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, token } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [telegramChannel, setTelegramChannel] = useState("")
  const [disableReason, setDisableReason] = useState("")
  const [showDisableForm, setShowDisableForm] = useState(false)

  // Check if user is an admin
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
  const isFav = isFavorite(id, "business")

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        // Generate a visitor ID if user is not logged in
        const visitorId = user?.id || sessionStorage.getItem("visitorId") || Math.random().toString(36).substring(2, 15)

        // Store visitor ID in session storage
        if (!user?.id && !sessionStorage.getItem("visitorId")) {
          sessionStorage.setItem("visitorId", visitorId)
        }

        const headers = {}
        if (!user?.id) {
          headers["x-visitor-id"] = visitorId
        } else {
          headers["Authorization"] = `Bearer ${token}`
        }

        const response = await axios.get(`/api/businesses/${id}`, { headers })
        setBusiness(response.data)

        // Set telegram channel based on campus
        const campus = response.data.campus
        const campusLinks = SOCIAL_MEDIA_LINKS[campus] || SOCIAL_MEDIA_LINKS.default
        if (campusLinks.telegram) {
          // Extract channel name from URL (e.g., https://t.me/unilagmarketplace -> unilagmarketplace)
          const channelName = campusLinks.telegram.split("/").pop().replace("+", "")
          setTelegramChannel(channelName)
        }
      } catch (error) {
        console.error("Error fetching business:", error)
        if (error.response?.status === 404) {
          toast.error("Business not found or has been removed")
          navigate("/businesses")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [id, user, token, navigate])

  // Add this new function and state
  const [campusAdmin, setCampusAdmin] = useState(null)

  useEffect(() => {
    const fetchCampusAdmin = async () => {
      if (!business?.campus) return

      try {
        const response = await axios.get(`/api/admin/campus-admin/${business.campus}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (response.data && response.data.website) {
          setCampusAdmin(response.data)
        }
      } catch (error) {
        console.error("Error fetching campus admin:", error)
      }
    }

    if (business) {
      fetchCampusAdmin()
    }
  }, [business, token])

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return
    }

    try {
      await axios.delete(`/api/businesses/${id}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update local state after deletion
      setBusiness((prev) => ({
        ...prev,
        Images: prev.Images.filter((img) => img.id !== imageId),
      }))

      // Reset selected image if needed
      if (selectedImage >= business.Images.length - 1) {
        setSelectedImage(Math.max(0, business.Images.length - 2))
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Failed to delete image")
    }
  }

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    // Don't allow more than 4 images total
    if (business.Images.length + files.length > 4) {
      toast.error("Maximum 4 images allowed")
      return
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append("images", file)
    })

    try {
      const response = await axios.post(`/api/businesses/${id}/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      // Update local state with new images
      setBusiness((prev) => ({
        ...prev,
        Images: [...prev.Images, ...response.data],
      }))
    } catch (error) {
      console.error("Error adding images:", error)
      toast.error("Failed to upload images")
    }
  }

  const joinTelegramChannel = () => {
    if (telegramChannel) {
      window.open(`https://t.me/${telegramChannel}`, "_blank")
    }
  }

  const handleDisableBusiness = async () => {
    if (!disableReason.trim()) {
      toast.error("Please provide a reason for disabling this business")
      return
    }

    try {
      await axios.post(
        `/api/admin/businesses/${id}/disable`,
        { reason: disableReason },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Business has been disabled")
      setBusiness((prev) => ({ ...prev, isDisabled: true, disabledReason: disableReason }))
      setShowDisableForm(false)
      setDisableReason("")
    } catch (error) {
      console.error("Error disabling business:", error)
      toast.error("Failed to disable business")
    }
  }

  const handleEnableBusiness = async () => {
    try {
      await axios.post(`/api/admin/businesses/${id}/enable`, {}, { headers: { Authorization: `Bearer ${token}` } })

      toast.success("Business has been enabled")
      setBusiness((prev) => ({ ...prev, isDisabled: false, disabledReason: null }))
    } catch (error) {
      console.error("Error enabling business:", error)
      toast.error("Failed to enable business")
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }

    await toggleFavorite(id, "business")
  }

  if (loading) {
    return <div className="text-center py-4">Loading...</div>
  }

  if (!business) {
    return <div className="text-center py-4">Business not found</div>
  }

  const isOwner = user && business.userId === user.id
  const timeAgo = formatDistanceToNow(new Date(business.createdAt), { addSuffix: true })

  return (
    <div className="container mx-auto px-2 py-2 max-w-4xl">
      {/* Disabled business warning */}
      {business.isDisabled && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
          <div className="flex items-start">
            <FiAlertTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-700">This business has been disabled</p>
              {business.disabledReason && (
                <p className="text-sm text-red-600 mt-1">Reason: {business.disabledReason}</p>
              )}
              <p className="text-sm text-red-600 mt-1">
                {isOwner
                  ? "Only you can see this business. Contact an admin if you believe this is a mistake."
                  : "This business is not visible to other users."}
              </p>
              {isOwner && (
                <p className="text-sm mt-2">
                  <a href="mailto:admin@campusmarketplace.com" className="text-primary hover:underline">
                    Contact Admin
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          {business.Images && business.Images.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              <div className="w-full h-[166px] overflow-hidden rounded-lg bg-gray-100 relative">
                <img
                  src={business.Images[selectedImage].url || "/placeholder.svg"}
                  alt={business.name}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleToggleFavorite}
                  className={`absolute top-2 right-2 z-10 rounded-full flex items-center justify-center 
                    ${isFav ? "bg-red-500 text-white" : "bg-white text-gray-600"} 
                    w-8 h-8 hover:scale-110 transition-all duration-200 shadow-md`}
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <FiHeart className={isFav ? "fill-current" : ""} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {business.Images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.thumbnailUrl || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-[55px] h-[55px] object-cover rounded cursor-pointer ${selectedImage === index ? "border-2 border-primary" : ""}`}
                      onClick={() => setSelectedImage(index)}
                    />
                    {isOwner && (
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {isOwner && business.Images.length < 4 && (
                  <label className="w-[55px] h-[55px] border border-dashed rounded flex items-center justify-center text-gray-500 cursor-pointer hover:border-primary">
                    <span className="text-2xl">+</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleAddImages}
                      max={4 - business.Images.length}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-[166px] bg-gray-200 rounded-lg flex items-center justify-center relative">
              <p>No image available</p>
              <button
                onClick={handleToggleFavorite}
                className={`absolute top-2 right-2 z-10 rounded-full flex items-center justify-center 
                  ${isFav ? "bg-red-500 text-white" : "bg-white text-gray-600"} 
                  w-8 h-8 hover:scale-110 transition-all duration-200 shadow-md`}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                <FiHeart className={isFav ? "fill-current" : ""} />
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-start">
            <h1 className="text-lg font-bold">{business.name}</h1>
            {isOwner && !business.isDisabled && (
              <button
                onClick={() => navigate(`/edit-business/${business.id}`)}
                className="text-primary hover:text-primary-dark"
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <div className="flex items-center">
              <FiClock className="mr-1" size={12} />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center">
              <FiEye className="mr-1" size={12} />
              <span>{business.viewCount || 0} views</span>
            </div>
          </div>

          <div className="mt-1 mb-2 flex flex-wrap gap-1">
            <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700">
              {business.category || "Uncategorized"}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 flex items-center">
              <FiMapPin size={10} className="mr-1" /> {business.campus}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <h2 className="text-xs font-semibold mb-1">Description</h2>
            <p className="text-xs whitespace-pre-line max-h-[60px] overflow-y-auto">{business.description}</p>
          </div>

          {(business.User?.phone || business.User?.website) && (
            <div className="mt-2 space-y-1">
              {business.User.website && (
                <a
                  href={
                    business.User.website.startsWith("http")
                      ? business.User.website
                      : `https://${business.User.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-primary hover:underline"
                >
                  <FiLink size={12} className="mr-1" />
                  {business.User.website}
                </a>
              )}
              {business.User.phone && (
                <a
                  href={`tel:${business.User.phone}`}
                  className="flex items-center text-xs text-primary hover:underline"
                >
                  <FiPhone size={12} className="mr-1" />
                  {business.User.phone}
                </a>
              )}
            </div>
          )}

          <div className="flex flex-wrap mt-2 gap-2">
            {!isOwner && !business.isDisabled && (
              <button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="flex items-center px-3 py-1 bg-primary text-white rounded-md text-xs hover:bg-primary-dark"
              >
                <FiMessageSquare className="mr-1" size={12} />
                Contact
              </button>
            )}

            {/* Add Contact Admin Button */}
            {campusAdmin && campusAdmin.website && (
              <a
                href={campusAdmin.website.startsWith("http") ? campusAdmin.website : `https://${campusAdmin.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
              >
                <FiAlertTriangle className="mr-1" size={12} />
                Contact Admin
              </a>
            )}

            <button
              onClick={joinTelegramChannel}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
            >
              <BsTelegram className="mr-1" size={12} />
              Join {business.campus} Telegram
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300"
            >
              <FiMessageCircle className="mr-1" size={12} />
              {showComments ? "Hide Comments" : "Show Comments"}
            </button>

            {/* Admin controls */}
            {isAdmin && !business.isDisabled && (
              <button
                onClick={() => setShowDisableForm(!showDisableForm)}
                className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
              >
                <FiShield className="mr-1" size={12} />
                Disable Business
              </button>
            )}

            {isAdmin && business.isDisabled && (
              <button
                onClick={handleEnableBusiness}
                className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600"
              >
                <FiShield className="mr-1" size={12} />
                Enable Business
              </button>
            )}
          </div>

          {/* Disable business form */}
          {showDisableForm && (
            <div className="mt-3 p-3 border border-red-200 rounded-md bg-red-50">
              <h3 className="text-sm font-medium text-red-700 mb-2">Disable Business</h3>
              <textarea
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder="Reason for disabling this business..."
                className="w-full px-3 py-2 text-xs border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                rows="2"
              ></textarea>
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  onClick={() => setShowDisableForm(false)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisableBusiness}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Disable
                </button>
              </div>
            </div>
          )}

          {showMessageForm && !isOwner && !business.isDisabled && (
            <div className="mt-2">
              <MessageForm
                receiverId={business.userId}
                businessId={business.id}
                onMessageSent={() => setShowMessageForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Telegram channel promotion */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-2">
        <h3 className="font-medium text-blue-800 flex items-center text-sm">
          <BsTelegram className="mr-1" size={16} />
          Join our {business.campus.toUpperCase()} Telegram Channel
        </h3>
        <p className="text-xs text-blue-600 mt-1">Get instant updates, special offers, and connect with others!</p>
        <button
          onClick={joinTelegramChannel}
          className="mt-1 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
        >
          Join Now
        </button>
      </div>

      {/* Similar Businesses */}
      <div className="mt-4">
        <h2 className="text-base font-semibold mb-1">Similar Businesses</h2>
        <SuggestedBusinesses currentBusinessId={business.id} category={business.category} campus={business.campus} />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 pt-2">
          <CommentSection itemId={business.id} itemType="business" />
        </div>
      )}
    </div>
  )
}

export default BusinessDetailPage