"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import toast from "react-hot-toast"

const CreateGigPage = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    budget: "",
    duration: "",
    campus: user?.campus || "",
  })
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 5) {
      toast.error("You can upload a maximum of 5 images")
      return
    }

    // Preview images
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setImages((prev) => [...prev, ...newImages])
    setImageFiles((prev) => [...prev, ...files])
  }

  const removeImage = (index) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)

    const newImageFiles = [...imageFiles]
    newImageFiles.splice(index, 1)
    setImageFiles(newImageFiles)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.budget) newErrors.budget = "Budget is required"
    if (Number.parseFloat(formData.budget) <= 0) newErrors.budget = "Budget must be greater than 0"\
    if (!formData.campus) newErrors.campus = "
