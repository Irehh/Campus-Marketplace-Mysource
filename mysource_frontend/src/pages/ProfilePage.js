"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import LinkTelegram from "../components/LinkTelegram"
import { CAMPUSES } from "../config"
import { FiPhone, FiLink, FiInfo } from "react-icons/fi"
import toast from "react-hot-toast"

const ProfilePage = () => {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [website, setWebsite] = useState(user?.website || "")
  const [selectedCampus, setSelectedCampus] = useState(CAMPUSES.find((c) => c.value === user?.campus) || null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateProfile({
        name,
        phone,
        website,
      })
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-xs text-blue-800 flex items-start">
        <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
        <p>
          Your phone number and website (if provided) will be displayed on your product and business listings to help
          potential customers contact you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="campus" className="label">
            Campus
          </label>
          <select id="campus" value={user?.campus || ""} className="input" disabled>
            {CAMPUSES.map((campus) => (
              <option key={campus.value} value={campus.value}>
                {campus.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Campus cannot be changed after registration</p>
        </div>

        <div>
          <label htmlFor="phone" className="label flex items-center">
            <FiPhone className="mr-1" size={14} /> Phone Number (Optional)
          </label>
          <input
            type="text"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="e.g., +234 800 123 4567"
          />
        </div>

        <div>
          <label htmlFor="website" className="label flex items-center">
            <FiLink className="mr-1" size={14} /> Website/Link (Optional)
          </label>
          <input
            type="text"
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="input"
            placeholder="e.g., www.example.com"
          />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Update Profile
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Link Telegram Account</h2>
        <LinkTelegram />
      </div>
    </div>
  )
}

export default ProfilePage


// import React, { useState, useEffect } from "react"
// import { useAuth } from "../contexts/AuthContext"
// import api from "../utils/api"
// import { FiPhone, FiLink, FiInfo } from "react-icons/fi"
// import toast from "react-hot-toast"
// import { CAMPUSES } from "../config"
// import LinkTelegram from "../components/LinkTelegram"

// // Create simple loader component
// const SimpleLoader = () => (
//   <div className="flex justify-center items-center h-64">
//     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//   </div>
// )

// const ProfilePage = () => {
//   const { user, updateUserContext } = useAuth()
//   const [loading, setLoading] = useState(false)
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     website: "",
//     campus: "",
//   })

//   useEffect(() => {
//     if (user) {
//       setFormData({
//         name: user.name || "",
//         email: user.email || "",
//         phone: user.phone || "",
//         website: user.website || "",
//         campus: user.campus || "",
//       })
//     }
//   }, [user])

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     try {
//       setLoading(true)
//       const response = await api.put("/api/auth/profile", formData)

//       // Update the user context with the new data
//       updateUserContext(response.data.data)

//       // Show success message
//       toast.success("Profile updated successfully!")
//     } catch (error) {
//       console.error("Error updating profile:", error)
//       toast.error(error.response?.data?.message || "Failed to update profile. Please try again.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   if (!user) {
//     return <SimpleLoader />
//   }

//   return (
//     <div className="max-w-3xl mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

//       <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6 text-sm text-blue-800 flex items-start">
//         <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
//         <p>
//           Your phone number and website (if provided) will be displayed on your product and business listings to help
//           potential customers contact you.
//         </p>
//       </div>

//       <div className="bg-white rounded-lg shadow-md p-6 mb-8">
//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Name */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Name</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 required
//               />
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100"
//                 disabled
//               />
//               <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
//             </div>

//             {/* Phone */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-2 flex items-center">
//                 <FiPhone className="mr-1" size={16} /> Phone Number (Optional)
//               </label>
//               <input
//                 type="tel"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 placeholder="e.g., +234 800 123 4567"
//               />
//             </div>

//             {/* Website */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-2 flex items-center">
//                 <FiLink className="mr-1" size={16} /> Website/Link (Optional)
//               </label>
//               <input
//                 type="url"
//                 name="website"
//                 value={formData.website}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 placeholder="e.g., www.example.com"
//               />
//             </div>

//             {/* Campus */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Campus</label>
//               <select
//                 name="campus"
//                 value={formData.campus}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100"
//                 disabled
//               >
//                 {CAMPUSES.map((campus) => (
//                   <option key={campus.value} value={campus.value}>
//                     {campus.label}
//                   </option>
//                 ))}
//               </select>
//               <p className="text-xs text-gray-500 mt-1">Campus cannot be changed after registration</p>
//             </div>
//           </div>

//           <div className="mt-6">
//             <button
//               type="submit"
//               className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
//               disabled={loading}
//             >
//               {loading ? "Updating..." : "Update Profile"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Telegram Integration Section */}
//       <div className="bg-white rounded-lg shadow-md p-6 mt-6">
//         <h2 className="text-xl font-bold mb-4">Link Telegram Account</h2>
//         <LinkTelegram />
//       </div>
//     </div>
//   )
// }

// export default ProfilePage