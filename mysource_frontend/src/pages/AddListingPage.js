"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import Select from "react-select"
import { PRODUCT_CATEGORIES, BUSINESS_CATEGORIES } from "../config"
import toast from "react-hot-toast"

const AddListingPage = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [listingType, setListingType] = useState("product")
  const [formData, setFormData] = useState({
    description: "",
    price: "",
    category: "",
    name: "", // For business
  })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (selectedOption) => {
    setSelectedCategory(selectedOption)
    setFormData((prev) => ({ ...prev, category: selectedOption ? selectedOption.value : "" }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const maxFiles = listingType === "product" ? 2 : 1
    setImages(files.slice(0, maxFiles))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formDataToSend = new FormData()

      if (listingType === "product") {
        if (!formData.description) {
          throw new Error("Description is required")
        }

        formDataToSend.append("description", formData.description)
        formDataToSend.append("price", formData.price || "0")
        formDataToSend.append("category", formData.category || "")
        formDataToSend.append("campus", user.campus)

        // Append images
        images.forEach((image) => {
          formDataToSend.append("images", image)
        })

        if (images.length === 0) {
          throw new Error("At least one image is required")
        }

        const response = await axios.post("/api/products", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })

        toast.success("Product added successfully!")
        navigate(`/products/${response.data.id}`)
      } else {
        if (!formData.name) {
          throw new Error("Business name is required")
        }

        if (!formData.description) {
          throw new Error("Description is required")
        }

        formDataToSend.append("name", formData.name)
        formDataToSend.append("description", formData.description)
        formDataToSend.append("category", formData.category || "")
        formDataToSend.append("campus", user.campus)

        // Append image (only one for business)
        if (images.length === 0) {
          throw new Error("Business image is required")
        }

        formDataToSend.append("image", images[0])

        const response = await axios.post("/api/businesses", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })

        toast.success("Business added successfully!")
        navigate(`/businesses/${response.data.id}`)
      }
    } catch (error) {
      console.error("Error adding listing:", error)
      setError(error.response?.data?.message || error.message || "Failed to add listing. Please try again.")
      toast.error(error.response?.data?.message || error.message || "Failed to add listing")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add New Listing</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 ${listingType === "product" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => setListingType("product")}
            >
              Product
            </button>
            <button
              type="button"
              className={`flex-1 py-2 ${listingType === "business" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => setListingType("business")}
            >
              Business
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <form onSubmit={handleSubmit}>
          {listingType === "business" && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {listingType === "product" && (
            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (NGN)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select
              options={listingType === "product" ? PRODUCT_CATEGORIES : BUSINESS_CATEGORIES}
              onChange={handleCategoryChange}
              value={selectedCategory}
              placeholder="Select Category"
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {listingType === "product" ? "Product Images*" : "Business Image*"}
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full px-3 py-2 border rounded-md"
              multiple={listingType === "product"}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {listingType === "product"
                ? `Selected ${images.length}/2 images (max 2)`
                : `Selected ${images.length}/1 image`}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddListingPage

