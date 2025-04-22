"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiPlus, FiMessageCircle, FiHeart } from "react-icons/fi"
import CampusSelector from "./CampusSelector"
import axios from "axios"
import { useFavorites } from "../contexts/FavoritesContext"

const Navbar = () => {
  const { user, isAuthenticated, logout, token } = useAuth()
  const { favorites } = useFavorites()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const timeoutRef = useRef(null)

  // Fetch unread messages count
  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchUnreadCount = async () => {
        try {
          const response = await axios.get("/api/messages/unread-count", {
            headers: { Authorization: `Bearer ${token}` },
          })
          setUnreadCount(response.data.count)
        } catch (error) {
          console.error("Error fetching unread messages count:", error)
        }
      }

      fetchUnreadCount()

      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, token])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery("")
      setIsMenuOpen(false)
    }
  }

  const handleLogout = () => {
    try {
      logout()
      navigate("/")
      setIsMenuOpen(false)
      setDropdownOpen(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleDropdownOpen = () => {
    setDropdownOpen(true)
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleDropdownClose = () => {
    // Set a timeout to close the dropdown after 4 seconds
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false)
    }, 4000) // 4 seconds
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-primary font-bold text-xl">Campus Market</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/products" className="text-secondary-700 hover:text-primary">
              Products
            </Link>
            <Link to="/businesses" className="text-secondary-700 hover:text-primary">
              Businesses
            </Link>
            <CampusSelector />

            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1 rounded-full border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            </form>

            {/* Auth Links */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/add-listing" className="btn btn-primary flex items-center text-sm">
                  <FiPlus className="mr-1" /> Add Listing
                </Link>
                {isAuthenticated && (
                  <>
                    <Link to="/favorites" className="text-secondary-700 hover:text-primary relative">
                      <FiHeart className="inline-block" />
                      <span className="ml-1">Favorites</span>
                      {favorites.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {favorites.length > 9 ? "9+" : favorites.length}
                        </span>
                      )}
                    </Link>
                    <Link to="/messages" className="text-secondary-700 hover:text-primary relative">
                      <FiMessageCircle className="inline-block" />
                      <span className="ml-1">Messages</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <div
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={handleDropdownOpen}
                  onMouseLeave={handleDropdownClose}
                >
                  <button className="flex items-center text-secondary-700 hover:text-primary">
                    <FiUser className="mr-1" />
                    {user?.name?.split(" ")[0] || "Account"}
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <div className="pt-2 pb-2">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="text-secondary-700 hover:text-primary text-sm">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-secondary-500 hover:text-primary">
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            </form>

            <CampusSelector />

            <div className="space-y-2">
              <Link
                to="/products"
                className="block py-2 text-secondary-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/businesses"
                className="block py-2 text-secondary-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Businesses
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="space-y-2 pt-2 border-t border-secondary-200">
                <Link
                  to="/add-listing"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPlus className="mr-2" /> Add Listing
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/favorites"
                      className="flex items-center py-2 text-secondary-700 hover:text-primary relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiHeart className="mr-2" /> Favorites
                      {favorites.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {favorites.length}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/messages"
                      className="flex items-center py-2 text-secondary-700 hover:text-primary relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiMessageCircle className="mr-2" /> Messages
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="mr-2" /> Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="mr-2" /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center py-2 text-secondary-700 hover:text-primary w-full text-left"
                >
                  <FiLogOut className="mr-2" /> Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-secondary-200">
                <Link
                  to="/login"
                  className="block py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

