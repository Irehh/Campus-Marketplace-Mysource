import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { FiUpload, FiDollarSign, FiCalendar, FiTag, FiMapPin } from "react-icons/fi"
import ImageUpload from "../components/ImageUpload"
import toast from "react-hot-toast"
import PageHeader from "../components/PageHeader"

const CreateGigPage = () => {
  const { isAuthenticated, user, token } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    description: "",
    budget: "",
    duration: "",
    category: "",
    skills: "",
    campus: user?.campus || "",
  })

  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const categories = [
    { value: "", label: "Select a category" },
    { value: "design", label: "Design" },
    { value: "writing", label: "Writing" },
    { value: "programming", label: "Programming" },
    { value: "marketing", label: "Marketing" },
    { value: "tutoring", label: "Tutoring" },
    { value: "errands", label: "Errands" },
    { value: "labor", label: "Labor" },
    { value: "other", label: "Other" },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleImagesChange = (uploadedImages) => {
    setImages(uploadedImages)

    // Clear error when images are uploaded
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length < 20) {
      newErrors.description = "Description should be at least 20 characters"
    }

    if (!formData.budget) {
      newErrors.budget = "Budget is required"
    } else if (isNaN(formData.budget) || Number(formData.budget) <= 0) {
      newErrors.budget = "Budget must be a positive number"
    }

    if (!formData.duration) {
      newErrors.duration = "Duration is required"
    } else if (isNaN(formData.duration) || Number(formData.duration) <= 0) {
      newErrors.duration = "Duration must be a positive number"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (!formData.campus) {
      newErrors.campus = "Campus is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error("You must be logged in to post a gig")
      navigate("/login", { state: { from: "/gigs/create" } })
      return
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const formDataObj = new FormData()
      formDataObj.append("description", formData.description)
      formDataObj.append("budget", formData.budget)
      formDataObj.append("duration", formData.duration)
      formDataObj.append("category", formData.category)
      formDataObj.append("campus", formData.campus)

      if (formData.skills) {
        formDataObj.append("skills", formData.skills)
      }

      // Append images if any
      images.forEach((image) => {
        formDataObj.append("images", image.file)
      })

      const response = await axios.post("/api/gigs", formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      toast.success("Gig created successfully!")
      navigate(`/gigs/${response.data.data.id}`)
    } catch (error) {
      console.error("Error creating gig:", error)
      toast.error(error.response?.data?.message || "Failed to create gig")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <PageHeader title="Post a Gig" />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Create a New Gig</h1>
          <p className="text-sm text-gray-500">Post a gig to find freelancers on your campus</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            {/* Description */}
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
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Describe what you need done..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Be specific about what you need, requirements, and expectations.
              </p>
            </div>

            {/* Budget and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.budget ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your budget"
                  min="100"
                />
                {errors.budget && <p className="mt-1 text-sm text-red-500">{errors.budget}</p>}
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
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.duration ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="How many days to complete"
                  min="1"
                />
                {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration}</p>}
              </div>
            </div>

            {/* Category and Campus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  <FiTag className="inline mr-1" /> Category*
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="campus" className="block text-sm font-medium text-gray-700 mb-1">
                  <FiMapPin className="inline mr-1" /> Campus*
                </label>
                <input
                  type="text"
                  id="campus"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.campus ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Your campus"
                  readOnly={!!user?.campus}
                />
                {errors.campus && <p className="mt-1 text-sm text-red-500">{errors.campus}</p>}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                Skills (optional)
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. Photoshop, Writing, Programming"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated list of skills required for this gig</p>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiUpload className="inline mr-1" /> Images (optional)
              </label>
              <ImageUpload onImagesChange={handleImagesChange} maxImages={5} acceptedFileTypes="image/*" />
              <p className="mt-1 text-xs text-gray-500">Upload up to 5 images related to your gig (max 5MB each)</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                disabled={loading}
              >
                {loading ? "Creating..." : "Post Gig"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGigPage
