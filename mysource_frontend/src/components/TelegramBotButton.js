
import { FaWhatsapp } from "react-icons/fa"
import { useMobile } from "../hooks/useMobile"
import { useAuth } from "../contexts/AuthContext"

const TelegramBotButton = () => {
  const isMobile = useMobile()
  const { isAuthenticated } = useAuth()
  const botUsername = process.env.REACT_APP_TELEGRAM_BOT_USERNAME

  if (!isAuthenticated || !botUsername) return null

  const handleOpenTelegramBot = () => {
    window.open(`google.com`, "_blank")
  }

  return (
    <button
      onClick={handleOpenTelegramBot}
      className={`fixed z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg 
                 transition-all duration-300 transform hover:scale-110 focus:outline-none
                 ${isMobile ? "bottom-20 right-4 p-3" : "bottom-6 right-6 p-4"}`}
      aria-label="Open Telegram Bot"
    >
      <div className="relative">
      <FaWhatsapp className="text-xl" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      </div>
    </button>
  )
}

export default TelegramBotButton

