"use client"
import { FaWhatsapp, FaTelegram } from "react-icons/fa"
import { useAuth } from "../contexts/AuthContext"
import { SOCIAL_MEDIA_LINKS } from "../config"

const SocialMediaButtons = () => {
  const { user } = useAuth()

  // Determine which links to use based on user's campus
  const campus = user?.campus || "default"
  const links = SOCIAL_MEDIA_LINKS[campus] || SOCIAL_MEDIA_LINKS.default

  return (
    <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-30 flex flex-col gap-2">
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-2 rounded-r-md shadow-md hover:bg-green-600 transition-colors"
        aria-label="Join WhatsApp Group"
        title="Join WhatsApp Group"
      >
        <FaWhatsapp size={18} />
      </a>
      <a
        href={links.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-500 text-white p-2 rounded-r-md shadow-md hover:bg-blue-600 transition-colors"
        aria-label="Join Telegram Group"
        title="Join Telegram Group"
      >
        <FaTelegram size={18} />
      </a>
    </div>
  )
}

export default SocialMediaButtons
