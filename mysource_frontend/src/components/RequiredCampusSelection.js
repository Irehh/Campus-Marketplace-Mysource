"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { CAMPUSES } from "../config"
import axios from "axios"
import toast from "react-hot-toast"

const RequiredCampusSelection = ({ onComplete }) => {
  const { user, token, updateProfile } = useAuth()
  const [selectedCampus, setSelectedCampus] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedCampus) {
      toast.error("Please select your campus")
      return
    }

    setLoading(true)

    try {
      await axios.put(
        "/api/auth/profile",
        { campus: selectedCampus },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Campus selected successfully!")
      onComplete()
    } catch (error) {
      console.error("Error updating campus:", error)
      toast.error("Failed to update campus. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Select Your Campus</h2>
        <p className="mb-4 text-gray-600">
          Please select your campus to continue. This helps us show you relevant listings and connect you with your
          campus community.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="campus" className="block text-sm font-medium text-gray-700 mb-1">
              Campus *
            </label>
            <select
              id="campus"
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select your campus</option>
              {CAMPUSES.map((campus) => (
                <option key={campus.value} value={campus.value}>
                  {campus.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark"
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RequiredCampusSelection

