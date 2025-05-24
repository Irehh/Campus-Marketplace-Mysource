"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import { FiUsers, FiDownload } from "react-icons/fi"
import { FaWhatsapp, FaTelegram } from "react-icons/fa"
import { SOCIAL_MEDIA_LINKS } from "../config"

const Footer = () => {
  const [activeUsers, setActiveUsers] = useState("0")
  const [totalUsers, setTotalUsers] = useState("0")
  const [campusUsers, setCampusUsers] = useState("0")
  const [activeCampusUsers, setActiveCampusUsers] = useState("0")
  const [loading, setLoading] = useState(true)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showInstallOption, setShowInstallOption] = useState(true) // Always show install option

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
    // Check if already in standalone mode
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

  // Get social media links based on campus
  const campus = Cookies.get("userCampus") || "default"
  const socialLinks = SOCIAL_MEDIA_LINKS[campus] || SOCIAL_MEDIA_LINKS.default

  return (
    <footer className="bg-white border-t border-secondary-200 py-4">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-wrap justify-between items-center gap-4 md:gap-0">
          <div className="flex-shrink-0">
            <Link to="/" className="text-primary font-bold text-xl">
              Mysource
            </Link>
            <p className="text-secondary-500 text-sm mt-1">The marketplace for campus communities</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm">
            <Link to="/products" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              Products
            </Link>
            <Link to="/businesses" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              Businesses
            </Link>
            <Link to="/gigs" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              Gigs
            </Link>
            <Link to="/about" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              About Us
            </Link>
            <Link to="/terms" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              Privacy Policy
            </Link>

            {/* Social Media Links */}
            {/* <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 flex items-center whitespace-nowrap"
              aria-label="WhatsApp Group"
            >
              <FaWhatsapp className="mr-1" /> WhatsApp
            </a>
            <a
              href={socialLinks.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 flex items-center whitespace-nowrap"
              aria-label="Telegram Group"
            >
              <FaTelegram className="mr-1" /> Telegram
            </a> */}

            {/* Always show install button */}
            <button
              onClick={handleInstall}
              className="text-secondary-600 hover:text-primary flex items-center whitespace-nowrap"
            >
              <FiDownload className="mr-1" /> Install App
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-between items-center gap-2 text-secondary-500 text-xs">
          <div className="flex-shrink-0">© {new Date().getFullYear()} Campus Marketplace. All rights reserved.</div>
          <div className="flex items-center bg-secondary-50 px-2 py-1 rounded-full flex-shrink-0">
            <FiUsers className="mr-1" />
            <span>{loading ? "..." : getUserCountDisplay()}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
