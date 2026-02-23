"use client"

import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"
import EventMarquee from "./EventMarquee"
import PwaInstallPrompt from "./PwaInstallPrompt"
import MobileNavigation from "./MobileNavigation"
import TelegramBotButton from "./TelegramBotButton"
import SocialMediaButtons from "./SocialMediaButtons"
import ScrollToTop from "./ScrollToTop"
import { useAuth } from "../contexts/AuthContext"

const Layout = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <EventMarquee />
      <div className="container mx-auto px-4 py-4 flex-grow max-w-6xl mb-16 md:mb-0">
        <Outlet />
      </div>
      <Footer />
      <PwaInstallPrompt />

      {/* Social Media Buttons */}
      <SocialMediaButtons />

      {/* Mobile Navigation - only visible on mobile */}
      {isAuthenticated && <MobileNavigation />}

      {/* Telegram Bot Button */}
      <TelegramBotButton />
    </div>
  )
}

export default Layout
