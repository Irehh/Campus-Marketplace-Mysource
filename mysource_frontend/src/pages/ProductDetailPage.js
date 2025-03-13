"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { formatCurrency } from "../utils/format"
import { useAuth } from "../contexts/AuthContext"
import MessageForm from "../components/MessageForm"
import SuggestedProducts from "../components/SuggestedProducts"

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showMessageForm, setShowMessageForm] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`)
        setProduct(response.data)
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!product) {
    return <div className="text-center py-8">Product not found</div>
  }

  const isOwner = user && product.userId === user.id

  return (
    <div className="container mx-auto px-2 py-2 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          {product.images && product.images.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              <div className="w-full h-[166px] overflow-hidden rounded-lg bg-gray-100 aspect-square">
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
          <h1 className="text-2xl font-bold mb-4">{product.description.split("\n")[0]}</h1>
          <p className="text-xl font-bold text-primary mb-4">{formatCurrency(product.price)}</p>

          <div className="mb-4">
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
              {product.category || "Uncategorized"}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
              {product.campus}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <h2 className="text-sm font-semibold mb-1">Description</h2>
            <p className="text-sm whitespace-pre-line max-h-[80px] overflow-y-auto">{product.description}</p>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h2 className="text-lg font-semibold mb-2">Seller</h2>
            <p>{product.user?.name || "Anonymous"}</p>
          </div>

          {!isOwner && (
            <div className="mt-6">
              {isAuthenticated ? (
                <button
                  onClick={() => setShowMessageForm(!showMessageForm)}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
                >
                  {showMessageForm ? "Cancel" : "Contact Seller"}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login", { state: { from: `/products/${id}` } })}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
                >
                  Login to Contact Seller
                </button>
              )}
            </div>
          )}

          {showMessageForm && !isOwner && (
            <div className="mt-4">
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
    </div>
  )
}

export default ProductDetailPage

