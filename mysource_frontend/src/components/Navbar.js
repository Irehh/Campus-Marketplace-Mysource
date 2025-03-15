"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiPlus } from "react-icons/fi"
import CampusSelector from "./CampusSelector"

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

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
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

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
                  <Link to="/messages" className="text-secondary-700 hover:text-primary relative">
                    Messages
                    {/* You can add an unread count badge here later */}
                  </Link>
                )}
                <div className="relative group">
                  <button className="flex items-center text-secondary-700 hover:text-primary">
                    <FiUser className="mr-1" />
                    {user?.name?.split(" ")[0] || "Account"}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block group-hover:duration-300 group-hover:transition-all">
                    <div className="pt-2 pb-2">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100">
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
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
                  <Link
                    to="/messages"
                    className="block py-2 text-secondary-700 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                )}
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

