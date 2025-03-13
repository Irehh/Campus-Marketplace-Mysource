"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import LinkTelegram from "../components/LinkTelegram"

const ProfilePage = () => {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [campus, setCampus] = useState(user?.campus || "")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateProfile({ name, campus })
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
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
          <input
            type="text"
            id="campus"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="input"
            required
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

