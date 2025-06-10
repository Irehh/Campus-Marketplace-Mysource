"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import { FiUsers, FiDownload } from "react-icons/fi"
import { FaWhatsapp, FaTelegram, FaTwitter, FaInstagram } from "react-icons/fa"
import { SOCIAL_MEDIA_LINKS } from "../config"

const Footer = () => {
  const [activeUsers, setActiveUsers] = useState("0")
  const [totalUsers, setTotalUsers] = useState("0")
  const [campusUsers, setCampusUsers] = useState("0")
  const [activeCampusUsers, setActiveCampusUsers] = useState("0")
  const [loading, setLoading] = useState(true)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const campus = Cookies.get("userCampus") || ""
        const allUsersResponse = await axios.get(`/api/auth/active-users`)
        setActiveUsers(allUsersResponse.data.activeCount)
        setTotalUsers(allUsersResponse.data.totalCount)

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
    const interval = setInterval(fetchActiveUsers, 6000000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    if (!isIOSDevice) {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      alert("To install, tap the Share button and select 'Add to Home Screen'.")
      return
    }

    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }
      setInstallPrompt(null)
    } else {
      alert(
        "Installation prompt not available. You may already have the app installed or your browser doesn't support PWA installation.",
      )
    }
  }

  const getUserCountDisplay = () => {
    const campus = Cookies.get("userCampus")
    if (campus) {
      const campusName = campus.toUpperCase()
      return `${activeCampusUsers} active, ${campusUsers} ${campusName}, ${totalUsers} total`
    } else {
      return `${activeUsers} active, ${totalUsers} total`
    }
  }

  const campus = Cookies.get("userCampus") || "default"
  const socialLinks = SOCIAL_MEDIA_LINKS[campus] || SOCIAL_MEDIA_LINKS.default

  return (
    <footer className="bg-gradient-to-r from-primary-700 to-primary-900 text-white">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="text-2xl font-bold text-white mb-4 block">
              Mysource
            </Link>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              The premier marketplace connecting campus communities. Buy, sell, and discover everything you need for
              student life.
            </p>
            <div className="flex items-center text-gray-300 text-sm mb-2">
              <FiUsers className="mr-2" size={16} />
              <span>{loading ? "..." : getUserCountDisplay()}</span>
            </div>
            <button
              onClick={handleInstall}
              className="btn btn-outline flex items-center text-sm"
            >
              <FiDownload className="mr-2" size={16} />
              Install App
            </button>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Marketplace</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/businesses" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/gigs" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Gigs
                </Link>
              </li>
              <li>
                <Link to="/add-listing" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Sell Something
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  My Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Account & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  My Wallet
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Profile Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2 mb-6">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold mb-3 text-sm text-white">Follow Us</h4>
              <div className="flex space-x-3">
                <a
                  href={socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                  aria-label="Telegram"
                >
                  <FaTelegram size={20} />
                </a>
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-500 transition-colors"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp size={20} />
                </a>
                <a href="https://x.com/mysource_ng" className="text-gray-300 hover:text-blue-400 transition-colors" aria-label="Twitter">
                  <FaTwitter size={20} />
                </a>
                <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors" aria-label="Instagram">
                  <FaInstagram size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-500 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Campus Marketplace. All rights reserved.
          </div>
          <div className="text-gray-300 text-sm">Made with ❤️ for campus communities</div>
        </div>
      </div>
    </footer>
  )
}

export default Footer