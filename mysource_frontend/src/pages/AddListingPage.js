

// import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { useAuth } from "../contexts/AuthContext"
// import axios from "axios"
// import Select from "react-select"
// import { PRODUCT_CATEGORIES, BUSINESS_CATEGORIES } from "../config"
// import toast from "react-hot-toast"

// const AddListingPage = () => {
//   const { user, token } = useAuth()
//   const navigate = useNavigate()
//   const [listingType, setListingType] = useState("product")
//   const [formData, setFormData] = useState({
//     description: "",
//     price: "",
//     category: "",
//     name: "", // For business
//   })
//   const [selectedCategory, setSelectedCategory] = useState(null)
//   const [images, setImages] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState("")
//   const [saving, setSaving] = useState(false)

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleCategoryChange = (selectedOption) => {
//     setSelectedCategory(selectedOption)
//     setFormData((prev) => ({ ...prev, category: selectedOption ? selectedOption.value : "" }))
//   }

//   const handleFileChange = (e) => {
//     const files = Array.from(e.target.files)
//     const maxFiles = listingType === "product" ? 2 : 1
//     setImages(files.slice(0, maxFiles))
//   }

//   // Update the handleSubmit function to remove title and campus fields
//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setSaving(true)

//     try {
//       // First update the product details
//       if (listingType === "product") {
//         if (!formData.description) {
//           throw new Error("Description is required")
//         }

//         const formDataToSend = new FormData()
//         formDataToSend.append("description", formData.description)
//         formDataToSend.append("price", formData.price || "0")
//         formDataToSend.append("category", formData.category || "")
//         // Campus is automatically set from user's profile

//         // Append images
//         images.forEach((image) => {
//           formDataToSend.append("images", image)
//         })

//         if (images.length === 0) {
//           throw new Error("At least one image is required")
//         }

//         const response = await axios.post("/api/products", formDataToSend, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: `Bearer ${token}`,
//           },
//         })

//         toast.success("Product added successfully!")
//         navigate(`/products/${response.data.id}`)
//       } else {
//         if (!formData.name) {
//           throw new Error("Business name is required")
//         }

//         if (!formData.description) {
//           throw new Error("Description is required")
//         }

//         const formDataToSend = new FormData()
//         formDataToSend.append("name", formData.name)
//         formDataToSend.append("description", formData.description)
//         formDataToSend.append("category", formData.category || "")
//         // Campus is automatically set from user's profile

//         // Append image (only one for business)
//         if (images.length === 0) {
//           throw new Error("Business image is required")
//         }

//         formDataToSend.append("image", images[0])

//         const response = await axios.post("/api/businesses", formDataToSend, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: `Bearer ${token}`,
//           },
//         })

//         toast.success("Business added successfully!")
//         navigate(`/businesses/${response.data.id}`)
//       }
//     } catch (error) {
//       console.error("Error adding listing:", error)
//       setError(error.response?.data?.message || error.message || "Failed to add listing. Please try again.")
//       toast.error(error.response?.data?.message || error.message || "Failed to add listing")
//     } finally {
//       setSaving(false)
//     }
//   }

//   return (
//     <div className="container mx-auto px-4 py-4 max-w-2xl">
//       <h1 className="text-xl font-bold mb-4">Add New Listing</h1>

//       <div className="bg-white shadow rounded-lg p-4">
//         <div className="mb-4">
//           <div className="flex border rounded-lg overflow-hidden">
//             <button
//               type="button"
//               className={`flex-1 py-2 ${listingType === "product" ? "bg-primary text-white" : "bg-gray-100"}`}
//               onClick={() => setListingType("product")}
//             >
//               Product
//             </button>
//             <button
//               type="button"
//               className={`flex-1 py-2 ${listingType === "business" ? "bg-primary text-white" : "bg-gray-100"}`}
//               onClick={() => setListingType("business")}
//             >
//               Business
//             </button>
//           </div>
//         </div>

//         {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

//         <form onSubmit={handleSubmit}>
//           {listingType === "business" && (
//             <div className="mb-3">
//               <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
//                 Business Name*
//               </label>
//               <input
//                 type="text"
//                 id="name"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-md text-sm"
//                 required
//               />
//             </div>
//           )}

//           <div className="mb-3">
//             <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
//               Description*
//             </label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               rows="3"
//               className="w-full px-3 py-2 border rounded-md text-sm"
//               required
//             />
//           </div>

//           {listingType === "product" && (
//             <div className="mb-3">
//               <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
//                 Price (NGN)
//               </label>
//               <input
//                 type="number"
//                 id="price"
//                 name="price"
//                 value={formData.price}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-md text-sm"
//               />
//             </div>
//           )}

//           <div className="mb-3">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//             <Select
//               options={listingType === "product" ? PRODUCT_CATEGORIES : BUSINESS_CATEGORIES}
//               onChange={handleCategoryChange}
//               value={selectedCategory}
//               placeholder="Select Category"
//               className="react-select-container text-sm"
//               classNamePrefix="react-select"
//             />
//           </div>

//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               {listingType === "product" ? "Product Images*" : "Business Image*"}
//             </label>
//             <input
//               type="file"
//               onChange={handleFileChange}
//               accept="image/*"
//               className="w-full px-3 py-2 border rounded-md text-sm"
//               multiple={listingType === "product"}
//               required
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               {listingType === "product"
//                 ? `Selected ${images.length}/2 images (max 2)`
//                 : `Selected ${images.length}/1 image`}
//             </p>
//           </div>

//           <div className="flex justify-end">
//             <button
//               type="submit"
//               className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark text-sm"
//               disabled={saving}
//             >
//               {saving ? "Adding..." : "Add Listing"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }

// export default AddListingPage


"use client"

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import Select from "react-select"
import { PRODUCT_CATEGORIES, BUSINESS_CATEGORIES, GIG_CATEGORIES } from "../config"
import toast from "react-hot-toast"
import { FiDollarSign, FiCalendar } from "react-icons/fi"
import ImageUpload from "../components/ImageUpload"

const AddListingPage = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [listingType, setListingType] = useState("product")
  const [formData, setFormData] = useState({
    description: "",
    price: "",
    category: "",
    name: "", // For business
    budget: "", // For gig
    duration: "", // For gig
    skills: "", // For gig
  })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const formSubmitRef = useRef(false) // Use ref to track form submission

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
    const maxFiles = listingType === "product" ? 2 : 5 // Allow up to 5 images for gigs
    setImages(files.slice(0, maxFiles))
  }

  const handleImagesChange = (uploadedImages) => {
    setImages(uploadedImages)
  }

  const validateForm = () => {
    // Basic validation
    if (listingType === "product" || listingType === "gig") {
      if (!formData.description) {
        setError("Description is required")
        return false
      }
    }

    if (listingType === "business" && !formData.name) {
      setError("Business name is required")
      return false
    }

    if (!formData.category) {
      setError("Category is required")
      return false
    }

    if (listingType === "gig") {
      if (!formData.budget) {
        setError("Budget is required")
        return false
      }
      if (!formData.duration) {
        setError("Duration is required")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Prevent duplicate submissions
    if (formSubmitRef.current) {
      console.log("Form already being submitted, preventing duplicate submission")
      return
    }

    if (!validateForm()) {
      toast.error(error)
      return
    }

    formSubmitRef.current = true
    setLoading(true)
    setError("")

    try {
      const formDataToSend = new FormData()

      if (listingType === "product") {
        formDataToSend.append("description", formData.description)
        formDataToSend.append("price", formData.price || "0")
        formDataToSend.append("category", formData.category || "")
        formDataToSend.append("campus", user.campus)

        // Append images
        images.forEach((image) => {
          formDataToSend.append("images", image.file || image)
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
      } else if (listingType === "business") {
        formDataToSend.append("name", formData.name)
        formDataToSend.append("description", formData.description)
        formDataToSend.append("category", formData.category || "")
        formDataToSend.append("campus", user.campus)

        // Append image (only one for business)
        if (images.length === 0) {
          throw new Error("Business image is required")
        }

        formDataToSend.append("image", images[0].file || images[0])

        const response = await axios.post("/api/businesses", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })

        toast.success("Business added successfully!")
        navigate(`/businesses/${response.data.id}`)
      } else if (listingType === "gig") {
        formDataToSend.append("description", formData.description)
        formDataToSend.append("budget", formData.budget || "0")
        formDataToSend.append("duration", formData.duration || "7")
        formDataToSend.append("category", formData.category || "")
        formDataToSend.append("campus", user.campus)

        if (formData.skills) {
          formDataToSend.append("skills", formData.skills)
        }

        // Append images if any
        images.forEach((image) => {
          formDataToSend.append("images", image.file || image)
        })

        const response = await axios.post("/api/gigs", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })

        toast.success("Gig created successfully!")
        navigate(`/gigs/${response.data.data.id}`)
      }
    } catch (error) {
      console.error(`Error adding ${listingType}:`, error)
      setError(error.response?.data?.message || error.message || `Failed to add ${listingType}. Please try again.`)
      toast.error(error.response?.data?.message || error.message || `Failed to add ${listingType}`)
    } finally {
      setLoading(false)
      // Reset the submission tracker after a short delay
      setTimeout(() => {
        formSubmitRef.current = false
      }, 1000)
    }
  }

  // Get the appropriate categories based on listing type
  const getCategoriesForType = () => {
    switch (listingType) {
      case "product":
        return PRODUCT_CATEGORIES
      case "business":
        return BUSINESS_CATEGORIES
      case "gig":
        return GIG_CATEGORIES
      default:
        return []
    }
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Add New Listing</h1>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="mb-4">
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
            <button
              type="button"
              className={`flex-1 py-2 ${listingType === "gig" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => setListingType("gig")}
            >
              Gig
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Business Name - Only for business */}
          {listingType === "business" && (
            <div className="mb-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
          )}

          {/* Description - For all listing types */}
          <div className="mb-3">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded-md text-sm"
              required
            />
            {listingType === "gig" && (
              <p className="mt-1 text-xs text-gray-500">
                Be specific about what you need, requirements, and expectations.
              </p>
            )}
          </div>

          {/* Price - Only for product */}
          {listingType === "product" && (
            <div className="mb-3">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (NGN)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          )}

          {/* Budget and Duration - Only for gig */}
          {listingType === "gig" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                  <FiDollarSign className="inline mr-1" /> Budget (₦)*
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Enter your budget"
                  min="100"
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  <FiCalendar className="inline mr-1" /> Duration (days)*
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="How many days to complete"
                  min="1"
                  required
                />
              </div>
            </div>
          )}

          {/* Skills - Only for gig */}
          {listingType === "gig" && (
            <div className="mb-3">
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                Skills (optional)
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g. Photoshop, Writing, Programming"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated list of skills required for this gig</p>
            </div>
          )}

          {/* Category - For all listing types */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select
              options={getCategoriesForType()}
              onChange={handleCategoryChange}
              value={selectedCategory}
              placeholder="Select Category"
              className="react-select-container text-sm"
              classNamePrefix="react-select"
            />
          </div>

          {/* Images */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {listingType === "product"
                ? "Product Images*"
                : listingType === "business"
                  ? "Business Image*"
                  : "Gig Images (optional)"}
            </label>
            {listingType === "gig" ? (
              <ImageUpload onImagesChange={handleImagesChange} maxImages={5} acceptedFileTypes="image/*" />
            ) : (
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border rounded-md text-sm"
                multiple={listingType === "product"}
                required={listingType !== "gig"}
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              {listingType === "product"
                ? `Selected ${images.length}/2 images (max 2)`
                : listingType === "business"
                  ? `Selected ${images.length}/1 image`
                  : `Upload up to 5 images related to your gig (max 5MB each)`}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark text-sm"
              disabled={loading || formSubmitRef.current}
            >
              {loading ? "Adding..." : `Add ${listingType.charAt(0).toUpperCase() + listingType.slice(1)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddListingPage
