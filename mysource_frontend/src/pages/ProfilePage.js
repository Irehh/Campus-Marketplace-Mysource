

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