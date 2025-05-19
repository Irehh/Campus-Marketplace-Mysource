

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import { BUSINESS_CATEGORIES } from "../../config"
import toast from "react-hot-toast"
import { FiArrowLeft, FiSave, FiTrash2 } from "react-icons/fi"

const EditBusinessPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  })
  const [images, setImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [imagesToDelete, setImagesToDelete] = useState([])

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await axios.get(`/api/businesses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const businessData = response.data
        setBusiness(businessData)
        setFormData({
          name: businessData.name,
          description: businessData.description,
          category: businessData.category || "",
        })

        if (businessData.images) {
          setImages(businessData.images)
        }
      } catch (error) {
        console.error("Error fetching business:", error)
        toast.error("Failed to load business")
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchBusiness()
    }
  }, [id, token, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Limit total images to 4
    const totalImages = images.length - imagesToDelete.length + newImages.length + files.length
    if (totalImages > 4) {
      toast.error("Maximum 4 images allowed")
      return
    }

    setNewImages((prev) => [...prev, ...files])
  }

  const removeExistingImage = (imageId) => {
    setImagesToDelete((prev) => [...prev, imageId])
  }

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // First update the business details
      await axios.put(`/api/businesses/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Delete images if needed
      for (const imageId of imagesToDelete) {
        await axios.delete(`/api/businesses/${id}/images/${imageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      // Add new images if any
      if (newImages.length > 0) {
        const formDataImages = new FormData()
        newImages.forEach((image) => {
          formDataImages.append("images", image)
        })

        await axios.post(`/api/businesses/${id}/images`, formDataImages, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })
      }

      toast.success("Business updated successfully")
      navigate(`/businesses/${id}`)
    } catch (error) {
      console.error("Error updating business:", error)
      toast.error("Failed to update business")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      return
    }

    try {
      await axios.delete(`/api/businesses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success("Business deleted successfully")
      navigate("/dashboard")
    } catch (error) {
      console.error("Error deleting business:", error)
      toast.error("Failed to delete business")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="text-center py-8">
        <p>Business not found or you don't have permission to edit it.</p>
        <Link to="/dashboard" className="text-primary hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Business</h1>
        <Link to="/dashboard" className="text-primary hover:underline flex items-center">
          <FiArrowLeft className="mr-1" /> Back to Dashboard
        </Link>
      </div>

      {business.isDisabled && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <p className="font-medium text-red-700">This business has been disabled by an admin.</p>
          {business.disabledReason && <p className="text-sm text-red-600 mt-1">Reason: {business.disabledReason}</p>}
          <p className="text-sm text-red-600 mt-1">
            This business is not visible to other users. Contact an admin if you believe this is a mistake.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Category</option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images (Maximum 4)</label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {/* Existing images */}
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative rounded-md overflow-hidden h-32 ${
                    imagesToDelete.includes(image.id) ? "opacity-50" : ""
                  }`}
                >
                  <img src={image.url || "/images/placeholder.png"} alt="Business" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      imagesToDelete.includes(image.id)
                        ? setImagesToDelete((prev) => prev.filter((id) => id !== image.id))
                        : removeExistingImage(image.id)
                    }
                    className={`absolute top-2 right-2 p-1 rounded-full ${
                      imagesToDelete.includes(image.id) ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {imagesToDelete.includes(image.id) ? "+" : "×"}
                  </button>
                </div>
              ))}

              {/* New images preview */}
              {newImages.map((file, index) => (
                <div key={index} className="relative rounded-md overflow-hidden h-32">
                  <img
                    src={URL.createObjectURL(file) || "/images/placeholder.png"}
                    alt={`New ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add image button */}
              {images.length - imagesToDelete.length + newImages.length < 4 && (
                <label className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center h-32 cursor-pointer hover:border-primary">
                  <div className="text-center">
                    <span className="block text-2xl text-gray-400">+</span>
                    <span className="block text-xs text-gray-500">Add Image</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            <p className="text-xs text-gray-500">{images.length - imagesToDelete.length + newImages.length}/4 images</p>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button type="button" onClick={handleDelete} className="flex items-center text-red-600 hover:text-red-800">
              <FiTrash2 className="mr-1" /> Delete Business
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              <FiSave className="mr-1" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBusinessPage

