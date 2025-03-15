"use client"

import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { CAMPUSES } from "../config"
import { useAuth } from "../contexts/AuthContext"

const CampusSelector = () => {
  const { isAuthenticated, user } = useAuth()
  const [selectedCampus, setSelectedCampus] = useState("")

  // Load campus from cookie on mount or from user profile if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setSelectedCampus(user.campus)
    } else {
      const savedCampus = Cookies.get("userCampus")
      if (savedCampus) {
        setSelectedCampus(savedCampus)
      }
    }
  }, [isAuthenticated, user])

  const handleCampusChange = (e) => {
    // Only allow changes for non-authenticated users
    if (isAuthenticated) return

    const campus = e.target.value
    setSelectedCampus(campus)

    // Save to cookie (30 days expiry)
    Cookies.set("userCampus", campus, { expires: 30 })

    // Refresh the page to apply the campus filter
    window.location.reload()
  }

  // If user is authenticated, show their campus but disable the selector
  if (isAuthenticated) {
    return (
      <select
        value={selectedCampus}
        disabled
        className="py-1 px-2 border border-secondary-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
      >
        {CAMPUSES.map((campus) => (
          <option key={campus.value} value={campus.value}>
            {campus.label}
          </option>
        ))}
      </select>
    )
  }

  // For non-authenticated users, allow campus selection
  return (
    <select
      value={selectedCampus}
      onChange={handleCampusChange}
      className="py-1 px-2 border border-secondary-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
    >
      <option value="">All Campuses</option>
      {CAMPUSES.map((campus) => (
        <option key={campus.value} value={campus.value}>
          {campus.label}
        </option>
      ))}
    </select>
  )
}

export default CampusSelector

