// "use client"

// import { useState } from "react"
// import { useAuth } from "../contexts/AuthContext"
// import LinkTelegram from "../components/LinkTelegram"
// import { CAMPUSES } from "../config"
// import { FiPhone, FiLink, FiInfo } from "react-icons/fi"
// import toast from "react-hot-toast"

// const ProfilePage = () => {
//   const { user, updateProfile } = useAuth()
//   const [name, setName] = useState(user?.name || "")
//   const [phone, setPhone] = useState(user?.phone || "")
//   const [website, setWebsite] = useState(user?.website || "")
//   const [selectedCampus, setSelectedCampus] = useState(CAMPUSES.find((c) => c.value === user?.campus) || null)

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     try {
//       await updateProfile({
//         name,
//         phone,
//         website,
//       })
//       toast.success("Profile updated successfully!")
//     } catch (error) {
//       console.error("Error updating profile:", error)
//       toast.error("Failed to update profile. Please try again.")
//     }
//   }

//   return (
//     <div className="max-w-md mx-auto mt-8">
//       <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

//       <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-xs text-blue-800 flex items-start">
//         <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
//         <p>
//           Your phone number and website (if provided) will be displayed on your product and business listings to help
//           potential customers contact you.
//         </p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label htmlFor="name" className="label">
//             Name
//           </label>
//           <input
//             type="text"
//             id="name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="input"
//             required
//           />
//         </div>

//         <div>
//           <label htmlFor="campus" className="label">
//             Campus
//           </label>
//           <select id="campus" value={user?.campus || ""} className="input" disabled>
//             {CAMPUSES.map((campus) => (
//               <option key={campus.value} value={campus.value}>
//                 {campus.label}
//               </option>
//             ))}
//           </select>
//           <p className="text-xs text-gray-500 mt-1">Campus cannot be changed after registration</p>
//         </div>

//         <div>
//           <label htmlFor="phone" className="label flex items-center">
//             <FiPhone className="mr-1" size={14} /> Phone Number (Optional)
//           </label>
//           <input
//             type="text"
//             id="phone"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             className="input"
//             placeholder="e.g., +234 800 123 4567"
//           />
//         </div>

//         <div>
//           <label htmlFor="website" className="label flex items-center">
//             <FiLink className="mr-1" size={14} /> Website/Link (Optional)
//           </label>
//           <input
//             type="text"
//             id="website"
//             value={website}
//             onChange={(e) => setWebsite(e.target.value)}
//             className="input"
//             placeholder="e.g., www.example.com"
//           />
//         </div>

//         <button type="submit" className="btn btn-primary w-full">
//           Update Profile
//         </button>
//       </form>

//       <div className="mt-8">
//         <h2 className="text-xl font-bold mb-4">Link Telegram Account</h2>
//         <LinkTelegram />
//       </div>
//     </div>
//   )
// }

// export default ProfilePage



"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"

// Create simple loader component
const SimpleLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
)

// Create simple page header component
const SimplePageHeader = ({ title }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    <div className="h-1 w-20 bg-primary mt-2"></div>
  </div>
)

const ProfilePage = () => {
  const { user, updateUserContext } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    campus: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        website: user.website || "",
        campus: user.campus || "",
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.put("/auth/profile", formData)

      // Update the user context with the new data
      updateUserContext(response.data.data)

      // Show success message
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert(error.response?.data?.message || "Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <SimpleLoader />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SimplePageHeader title="My Profile" />

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com"
              />
            </div>

            {/* Campus */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Campus</label>
              <select
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select Campus</option>
                <option value="unilag">University of Lagos</option>
                <option value="lasu">Lagos State University</option>
                <option value="ui">University of Ibadan</option>
                <option value="oau">Obafemi Awolowo University</option>
                <option value="unilorin">University of Ilorin</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Telegram Integration Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Telegram Integration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Link your Telegram account to receive notifications about your listings and messages.
        </p>

        {/* Use the TelegramLinkForm component we created */}
        <div className="bg-white rounded-lg p-4">
          {user?.telegramChatId ? (
            <div className="text-center">
              <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
                <p className="font-medium">✅ Your Telegram account is linked!</p>
                <p className="text-sm mt-1">You will receive notifications via Telegram.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    setLoading(true)
                    await api.post("/telegram/unlink")
                    alert("Telegram account unlinked successfully!")
                    if (updateUserContext) updateUserContext()
                  } catch (error) {
                    alert("Failed to unlink Telegram account")
                  } finally {
                    setLoading(false)
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                disabled={loading}
              >
                {loading ? "Processing..." : "Unlink Telegram Account"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-800 p-3 rounded-md flex-1">
                  <p className="font-medium">Link your Telegram account in two steps:</p>
                  <ol className="list-decimal list-inside mt-2 ml-2 text-sm">
                    <li className="mb-1">Start our Telegram bot and get a verification code</li>
                    <li>Enter the code below to link your account</li>
                  </ol>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => window.open("https://t.me/your_bot_username", "_blank")}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 mr-2"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Start Telegram Bot
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const code = e.target.code.value

                  try {
                    setLoading(true)
                    console.log("Submitting verification code:", code)
                    await api.post("/telegram/verify-code", { code })
                    alert("Telegram account linked successfully!")
                    if (updateUserContext) updateUserContext()
                  } catch (error) {
                    console.error("Error verifying Telegram code:", error)
                    alert(error.response?.data?.message || "Failed to verify code. Please try again.")
                  } finally {
                    setLoading(false)
                  }
                }}
                className="mt-4"
              >
                <div className="mb-4">
                  <label htmlFor="code" className="block text-gray-700 font-medium mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter 6-digit code"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code you received from our Telegram bot
                  </p>
                </div>

                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

