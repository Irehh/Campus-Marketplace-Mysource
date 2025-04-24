"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import { FiUsers, FiDownload } from "react-icons/fi"

const Footer = () => {
  const [activeUsers, setActiveUsers] = useState("0")
  const [totalUsers, setTotalUsers] = useState("0")
  const [campusUsers, setCampusUsers] = useState("0")
  const [activeCampusUsers, setActiveCampusUsers] = useState("0")
  const [loading, setLoading] = useState(true)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showInstallOption, setShowInstallOption] = useState(false)

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
    if (localStorage.getItem("pwaPromptDismissed")) return

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallOption(true)
    }

    if (!isIOSDevice) {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    } else {
      setShowInstallOption(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      alert("To install, tap the Share button and select 'Add to Home Screen'.");
      return;
    }

    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
        setShowInstallOption(false)
      } else {
        console.log("User dismissed the install prompt")
      }
      setInstallPrompt(null)
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

  return (
    <footer className="bg-white border-t border-secondary-200 py-4">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-wrap justify-between items-center gap-4 md:gap-0">
          <div className="flex-shrink-0">
            <Link to="/" className="text-primary font-bold text-xl">
              Campus Market
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
            <a href="#" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              Terms of Service
            </a>
            <a href="#" className="text-secondary-600 hover:text-primary whitespace-nowrap">
              Privacy Policy
            </a>
            {showInstallOption && (
              <button
                onClick={handleInstall}
                className="text-secondary-600 hover:text-primary flex items-center whitespace-nowrap"
              >
                <FiDownload className="mr-1" /> Install App
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-between items-center gap-2 text-secondary-500 text-xs">
          <div className="flex-shrink-0">
            © {new Date().getFullYear()} Campus Marketplace. All rights reserved.
          </div>
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