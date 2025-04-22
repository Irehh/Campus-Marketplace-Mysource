import React from "react"

const Loader = ({ size = "medium", className = "" }) => {
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-4",
    large: "w-12 h-12 border-4",
  }

  return (
    <div className="flex justify-center items-center py-4">
      <div
        className={`${sizeClasses[size]} ${className} rounded-full border-gray-200 border-t-primary animate-spin`}
      ></div>
    </div>
  )
}

export default Loader