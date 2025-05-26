"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import api from "../utils/api"
import { ShoppingCart } from "lucide-react"

const CartIcon = () => {
  const { user } = useContext(AuthContext)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchCartCount()
    }
  }, [user])

  const fetchCartCount = async () => {
    try {
      const response = await api.get("/cart")
      const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(totalItems)
    } catch (error) {
      console.error("Error fetching cart count:", error)
    }
  }

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (user) {
        fetchCartCount()
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    return () => window.removeEventListener("cartUpdated", handleCartUpdate)
  }, [user])

  if (!user) return null

  return (
    <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900">
      <ShoppingCart className="w-6 h-6" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  )
}

export default CartIcon
