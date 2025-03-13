"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import MessageForm from "../components/MessageForm"
import SuggestedBusinesses from "../components/SuggestedBusinesses"
import { FiEdit2, FiTrash2, FiMessageSquare, FiMapPin } from "react-icons/fi"
import { BsTelegram } from "react-icons/bs"

const BusinessDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, token } = useAuth()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [telegramChannel, setTelegramChannel] = useState("")

  // Mapping of campus codes to telegram channels
  const campusChannels = {
    unilag: "unilag_marketplace",
    uniben: "uniben_marketplace",
    ui: "ui_marketplace",
    oau: "oau_marketplace",
    uniport: "uniport_marketplace",
  }

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await axios.get(`/api/businesses/${id}`)
        setBusiness(response.data)

        // Set telegram channel based on campus
        const campus = response.data.campus
        if (campusChannels[campus]) {
          setTelegramChannel(campusChannels[campus])
        }
      } catch (error) {
        console.error("Error fetching business:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [id])

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
        images: prev.images.filter((img) => img.id !== imageId),
      }))

      // Reset selected image if needed
      if (selectedImage >= business.images.length - 1) {
        setSelectedImage(Math.max(0, business.images.length - 2))
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      alert("Failed to delete image")
    }
  }

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    // Don't allow more than 4 images total
    if (business.images.length + files.length > 4) {
      alert("Maximum 4 images allowed")
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
        images: [...prev.images, ...response.data],
      }))
    } catch (error) {
      console.error("Error adding images:", error)
      alert("Failed to upload images")
    }
  }

  const joinTelegramChannel = () => {
    if (telegramChannel) {
      window.open(`https://t.me/${telegramChannel}`, "_blank")
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading...</div>
  }

  if (!business) {
    return <div className="text-center py-4">Business not found</div>
  }

  const isOwner = user && business.userId === user.id

  return (
    <div className="container mx-auto px-2 py-2 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          {business.images && business.images.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              <div className="w-full h-[166px] overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={business.images[selectedImage].url || "/placeholder.svg"}
                  alt={business.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {business.images.map((image, index) => (
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
                {isOwner && business.images.length < 4 && (
                  <label className="w-[55px] h-[55px] border border-dashed rounded flex items-center justify-center text-gray-500 cursor-pointer hover:border-primary">
                    <span className="text-2xl">+</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleAddImages}
                      max={4 - business.images.length}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-[166px] bg-gray-200 rounded-lg flex items-center justify-center">
              <p>No image available</p>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold">{business.name}</h1>
            {isOwner && (
              <button
                onClick={() => navigate(`/edit-business/${business.id}`)}
                className="text-primary hover:text-primary-dark"
              >
                <FiEdit2 size={18} />
              </button>
            )}
          </div>

          <div className="mt-1 mb-2">
            <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-1">
              {business.category || "Uncategorized"}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 flex items-center">
              <FiMapPin size={10} className="mr-1" /> {business.campus}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <h2 className="text-sm font-semibold mb-1">Description</h2>
            <p className="text-sm whitespace-pre-line max-h-[80px] overflow-y-auto">{business.description}</p>
          </div>

          <div className="flex flex-wrap mt-2 gap-2">
            {!isOwner && (
              <button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="flex items-center px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-dark"
              >
                <FiMessageSquare className="mr-1" size={14} />
                Contact
              </button>
            )}

            <button
              onClick={joinTelegramChannel}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              <BsTelegram className="mr-1" size={14} />
              Join {business.campus} Telegram
            </button>
          </div>

          {showMessageForm && !isOwner && (
            <div className="mt-4">
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
    </div>
  )
}

export default BusinessDetailPage

