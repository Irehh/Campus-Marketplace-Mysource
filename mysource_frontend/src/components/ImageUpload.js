"use client"

import { useState, useRef } from "react"
import { FiX, FiUpload } from "react-icons/fi"

const ImageUpload = ({ onChange, maxImages = 2, minImages = 1 }) => {
  const [previews, setPreviews] = useState([])
  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (!e.target.files?.length) return

    const newFiles = Array.from(e.target.files)
    const validFiles = newFiles.slice(0, maxImages - files.length)

    // Create preview URLs
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file))

    setFiles((prev) => [...prev, ...validFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
    onChange([...files, ...validFiles])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index])

    const newPreviews = [...previews]
    newPreviews.splice(index, 1)
    setPreviews(newPreviews)

    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    onChange(newFiles)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((preview, index) => (
          <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
            <img
              src={preview || "/placeholder.svg"}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
            >
              <FiX className="h-4 w-4 text-secondary-700" />
              <span className="sr-only">Remove image</span>
            </button>
          </div>
        ))}

        {files.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 border border-dashed rounded flex flex-col items-center justify-center text-secondary-500 hover:text-primary hover:border-primary transition-colors"
          >
            <FiUpload className="h-6 w-6 mb-1" />
            <span className="text-xs">Upload</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        multiple={maxImages > 1}
      />

      <p className="text-xs text-secondary-500">
        {minImages > 0
          ? `Upload at least ${minImages} image${minImages > 1 ? "s" : ""}, max ${maxImages}`
          : `Upload up to ${maxImages} images`}
      </p>
    </div>
  )
}

export default ImageUpload

