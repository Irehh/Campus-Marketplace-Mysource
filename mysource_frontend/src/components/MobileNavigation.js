import { Link, useLocation } from "react-router-dom"
import { FiHome, FiHeart, FiPlusCircle, FiMessageCircle, FiUser } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import { useFavorites } from "../contexts/FavoritesContext"

const MobileNavigation = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { favorites } = useFavorites()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 md:hidden">
      <div className="flex justify-around items-center h-14">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-1/5 ${
            isActive("/") ? "text-primary" : "text-gray-500"
          }`}
        >
          <FiHome size={20} />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          to="/favorites"
          className={`flex flex-col items-center justify-center w-1/5 ${
            isActive("/favorites") ? "text-primary" : "text-gray-500"
          } relative`}
        >
          <FiHeart size={20} />
          <span className="text-xs mt-1">Favorites</span>
          {isAuthenticated && favorites.length > 0 && (
            <span className="absolute -top-1 right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {favorites.length > 9 ? "9+" : favorites.length}
            </span>
          )}
        </Link>

        <Link
          to="/add-listing"
          className="flex flex-col items-center justify-center w-1/5 text-primary"
        >
          <div className="bg-primary text-white rounded-full p-2 -mt-6 shadow-lg">
            <FiPlusCircle size={24} />
          </div>
          <span className="text-xs mt-1">Sell</span>
        </Link>

        <Link
          to="/messages"
          className={`flex flex-col items-center justify-center w-1/5 ${
            isActive("/messages") ? "text-primary" : "text-gray-500"
          }`}
        >
          <FiMessageCircle size={20} />
          <span className="text-xs mt-1">Messages</span>
        </Link>

        <Link
          to={isAuthenticated ? "/profile" : "/login"}
          className={`flex flex-col items-center justify-center w-1/5 ${
            isActive("/profile") || isActive("/login") ? "text-primary" : "text-gray-500"
          }`}
        >
          <FiUser size={20} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  )
}

export default MobileNavigation