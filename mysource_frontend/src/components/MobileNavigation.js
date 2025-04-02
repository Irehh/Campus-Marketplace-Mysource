"use client"

import React from "react"
import { Link, useLocation } from "react-router-dom"
import { FiHome, FiHeart, FiPlusCircle, FiMessageCircle, FiUser } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"

const MobileNavigation = () => {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [unreadCount, setUnreadCount] = React.useState(0)

  // Check if the current path matches the nav item path
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true
    if (path !== "/" && location.pathname.startsWith(path)) return true
    return false
  }

  // Fetch unread messages count (simplified version)
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // This would typically be an API call to get unread count
      // For now, we'll just use a placeholder
      setUnreadCount(user.unreadMessages || 0)
    }
  }, [isAuthenticated, user])

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 z-40">
      <div className="flex justify-around items-center h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-1/5 py-1 ${
            isActive("/") ? "text-primary" : "text-secondary-500"
          }`}
        >
          <FiHome className="text-xl mb-1" />
          <span className="text-xs">Home</span>
        </Link>

        <Link
          to="/favorites"
          className={`flex flex-col items-center justify-center w-1/5 py-1 ${
            isActive("/favorites") ? "text-primary" : "text-secondary-500"
          }`}
        >
          <FiHeart className="text-xl mb-1" />
          <span className="text-xs">Favorites</span>
        </Link>

        <Link
          to="/add-listing"
          className={`flex flex-col items-center justify-center w-1/5 py-1 ${
            isActive("/add-listing") ? "text-primary" : "text-secondary-500"
          }`}
        >
          <div className="bg-primary text-white rounded-full p-2 -mt-6 shadow-lg">
            <FiPlusCircle className="text-xl" />
          </div>
          <span className="text-xs mt-1">Sell</span>
        </Link>

        <Link
          to="/messages"
          className={`flex flex-col items-center justify-center w-1/5 py-1 relative ${
            isActive("/messages") ? "text-primary" : "text-secondary-500"
          }`}
        >
          <FiMessageCircle className="text-xl mb-1" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-1/4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="text-xs">Messages</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center w-1/5 py-1 ${
            isActive("/profile") ? "text-primary" : "text-secondary-500"
          }`}
        >
          <FiUser className="text-xl mb-1" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  )
}

export default MobileNavigation

