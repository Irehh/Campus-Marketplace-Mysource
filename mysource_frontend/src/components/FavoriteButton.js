import React from "react"
import { FiHeart } from "react-icons/fi"
import { useFavorites } from "../contexts/FavoritesContext"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const FavoriteButton = ({ itemId, itemType = "product", className = "" }) => {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const isFav = isFavorite(itemId, itemType)

  const handleToggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    
    await toggleFavorite(itemId, itemType)
  }

  return (
    <button
      onClick={handleToggleFavorite}
      className={`absolute ${className} z-10 rounded-full flex items-center justify-center 
        ${isFav ? 'bg-red-500 text-white' : 'bg-white text-gray-600'} 
        w-8 h-8 hover:scale-110 transition-all duration-200 shadow-md`}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <FiHeart className={isFav ? "fill-current" : ""} />
    </button>
  )
}

export default FavoriteButton