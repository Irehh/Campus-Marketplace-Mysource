"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { formatCurrency } from "../utils/format"
import { useAuth } from "../contexts/AuthContext"
import MessageForm from "../components/MessageForm"
import SuggestedProducts from "../components/SuggestedProducts"
import { FiMessageSquare, FiMapPin, FiLink, FiPhone, FiClock, FiMessageCircle, FiEye } from "react-icons/fi"
import { BsTelegram } from "react-icons/bs"
import { formatDistanceToNow } from "date-fns"
import CommentSection from "../components/CommentSection"

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [showComments, setShowComments] = useState(false)
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
    const fetchProduct = async () => {
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
        }

        const response = await axios.get(`/api/products/${id}`, { headers })
        setProduct(response.data)

        // Set telegram channel based on campus
        const campus = response.data.campus
        if (campusChannels[campus]) {
          setTelegramChannel(campusChannels[campus])
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, user])

  const joinTelegramChannel = () => {
    if (telegramChannel) {
      window.open(`https://t.me/${telegramChannel}`, "_blank")
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading...</div>
  }

  if (!product) {
    return <div className="text-center py-4">Product not found</div>
  }

  const isOwner = user && product.userId === user.id
  const timeAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })

  return (
    <div className="container mx-auto px-2 py-2 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          {product.images && product.images.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              <div className="w-full h-[166px] overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={product.images[selectedImage].url || "/placeholder.svg"}
                  alt={product.description}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {product.images.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.thumbnailUrl || "/placeholder.svg"}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-[55px] h-[55px] object-cover rounded cursor-pointer ${selectedImage === index ? "border-2 border-primary" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
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
            <h1 className="text-lg font-bold">{product.description.split("\n")[0]}</h1>
            <p className="text-base font-bold text-primary">{formatCurrency(product.price)}</p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <div className="flex items-center">
              <FiClock className="mr-1" size={12} />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center">
              <FiEye className="mr-1" size={12} />
              <span>{product.viewCount || 0} views</span>
            </div>
          </div>

          <div className="mt-1 mb-2 flex flex-wrap gap-1">
            <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700">
              {product.category || "Uncategorized"}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 flex items-center">
              <FiMapPin size={10} className="mr-1" /> {product.campus}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <h2 className="text-xs font-semibold mb-1">Description</h2>
            <p className="text-xs whitespace-pre-line max-h-[60px] overflow-y-auto">{product.description}</p>
          </div>

          {(product.user?.phone || product.user?.website) && (
            <div className="mt-2 space-y-1">
              {product.user.website && (
                <a
                  href={
                    product.user.website.startsWith("http") ? product.user.website : `https://${product.user.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-primary hover:underline"
                >
                  <FiLink size={12} className="mr-1" />
                  {product.user.website}
                </a>
              )}
              {product.user.phone && (
                <a
                  href={`tel:${product.user.phone}`}
                  className="flex items-center text-xs text-primary hover:underline"
                >
                  <FiPhone size={12} className="mr-1" />
                  {product.user.phone}
                </a>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold">Seller</h2>
              <span className="text-xs">{product.user?.name || "Anonymous"}</span>
            </div>
          </div>

          <div className="flex flex-wrap mt-2 gap-2">
            {!isOwner && (
              <button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="flex items-center px-3 py-1 bg-primary text-white rounded-md text-xs hover:bg-primary-dark"
              >
                <FiMessageSquare className="mr-1" size={12} />
                Contact Seller
              </button>
            )}

            <button
              onClick={joinTelegramChannel}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
            >
              <BsTelegram className="mr-1" size={12} />
              Join {product.campus} Telegram
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300"
            >
              <FiMessageCircle className="mr-1" size={12} />
              {showComments ? "Hide Comments" : "Show Comments"}
            </button>
          </div>

          {showMessageForm && !isOwner && (
            <div className="mt-2">
              <MessageForm
                receiverId={product.userId}
                productId={product.id}
                onMessageSent={() => setShowMessageForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Suggested Products */}
      <div className="mt-4 border-t border-gray-200 pt-2">
        <h2 className="text-base font-semibold mb-1">You might also like</h2>
        <SuggestedProducts currentProductId={product.id} category={product.category} campus={product.campus} />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 pt-2">
          <CommentSection itemId={product.id} itemType="product" />
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage

