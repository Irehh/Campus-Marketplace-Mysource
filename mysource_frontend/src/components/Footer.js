"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import { FiUsers } from "react-icons/fi"

const Footer = () => {
  const [activeUsers, setActiveUsers] = useState("0")
  const [totalUsers, setTotalUsers] = useState("0")
  const [campusUsers, setCampusUsers] = useState("0")
  const [activeCampusUsers, setActiveCampusUsers] = useState("0")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const campus = Cookies.get("userCampus") || ""

        // Get all users count
        const allUsersResponse = await axios.get(`/api/auth/active-users`)
        setActiveUsers(allUsersResponse.data.activeCount)
        setTotalUsers(allUsersResponse.data.totalCount)

        // Get campus-specific users count if a campus is selected
        if (campus) {
          const campusUsersResponse = await axios.get(`/api/auth/active-users?campus=${campus}`)
          setActiveCampusUsers(campusUsersResponse.data.activeCount)
          setCampusUsers(campusUsersResponse.data.totalCount)
        }
      } catch (error) {
        console.error("Error fetching active users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveUsers()

    // Refresh active users count every minute
    const interval = setInterval(fetchActiveUsers, 6000000)

    return () => clearInterval(interval)
  }, [])

  // Format the display string based on whether a campus is selected
  const getUserCountDisplay = () => {
    const campus = Cookies.get("userCampus")
    if (campus) {
      const campusName = campus.toUpperCase()
      return `${activeCampusUsers} active, ${campusUsers} total on ${campusName}, ${totalUsers} platform-wide`
    } else {
      return `${activeUsers} active, ${totalUsers} total users`
    }
  }

  return (
    <footer className="bg-white border-t border-secondary-200 py-4">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-primary font-bold text-xl">
              Campus Market
            </Link>
            <p className="text-secondary-500 text-sm mt-1">The marketplace for campus communities</p>
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
            <Link to="/products" className="text-secondary-600 hover:text-primary">
              Products
            </Link>
            <Link to="/businesses" className="text-secondary-600 hover:text-primary">
              Businesses
            </Link>
            <a href="#" className="text-secondary-600 hover:text-primary">
              Terms of Service
            </a>
            <a href="#" className="text-secondary-600 hover:text-primary">
              Privacy Policy
            </a>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center text-secondary-500 text-xs">
          <div>&copy; {new Date().getFullYear()} Campus Marketplace. All rights reserved.</div>
          <div className="flex items-center bg-secondary-50 px-2 py-1 rounded-full">
            <FiUsers className="mr-1" />
            <span>{loading ? "..." : getUserCountDisplay()}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

