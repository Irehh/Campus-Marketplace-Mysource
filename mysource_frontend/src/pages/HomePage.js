"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import ProductCard from "../components/ProductCard"
import BusinessCard from "../components/BusinessCard"
import { FiSearch, FiShoppingBag, FiGrid } from "react-icons/fi"
import { BsTelegram } from "react-icons/bs"
import { useAuth } from "../contexts/AuthContext"

const HomePage = () => {
  const { isAuthenticated, user } = useAuth()
  const [products, setProducts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userCampus, setUserCampus] = useState("")

  // Mapping of campus codes to telegram channels
  const campusChannels = {
    unilag: "unilag_marketplace",
    uniben: "uniben_marketplace",
    ui: "ui_marketplace",
    oau: "oau_marketplace",
    uniport: "uniport_marketplace",
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get campus from user if authenticated, otherwise from cookie
        const campus = isAuthenticated ? user.campus : Cookies.get("userCampus") || ""
        setUserCampus(campus)

        // Fetch products and businesses in parallel
        const [productsRes, businessesRes] = await Promise.all([
          axios.get(`/api/products?campus=${campus}&limit=4`),
          axios.get(`/api/businesses?campus=${campus}&limit=3`),
        ])

        setProducts(productsRes.data.products)
        setBusinesses(businessesRes.data.businesses)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const joinTelegramChannel = () => {
    const channel = userCampus ? campusChannels[userCampus] : "campus_marketplace_general"
    window.open(`https://t.me/${channel}`, "_blank")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-lg p-4 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Campus Marketplace</h1>
        <p className="text-sm mb-4 max-w-2xl mx-auto">
          Find products and businesses on your campus. Buy, sell, and discover local services.
        </p>

        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search products or businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-primary-700 rounded-full p-1"
          >
            <FiSearch size={18} />
          </button>
        </form>
      </section>

      {/* Telegram Promotion */}
      <section className="bg-blue-500 text-white rounded-lg p-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-20">
          <BsTelegram size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center">
            <BsTelegram size={24} className="mr-2" />
            <h2 className="text-lg font-bold">Join our Telegram Community!</h2>
          </div>
          <p className="text-sm mt-1 mb-2">
            Get instant updates, exclusive deals, and connect with other students on your campus.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={joinTelegramChannel}
              className="bg-white text-blue-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-50"
            >
              Join Now
            </button>
            <Link to="/telegram-info" className="text-white/80 text-sm underline hover:text-white">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiShoppingBag className="mr-2" /> Featured Products
          </h2>
          <Link to="/products" className="text-primary hover:underline text-xs">
            View all
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No products found.</p>
            <Link to="/add-listing" className="text-primary hover:underline mt-1 inline-block text-xs">
              Be the first to add a product!
            </Link>
          </div>
        )}
      </section>

      {/* Featured Businesses */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiGrid className="mr-2" /> Campus Businesses
          </h2>
          <Link to="/businesses" className="text-primary hover:underline text-xs">
            View all
          </Link>
        </div>

        {businesses.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No businesses found.</p>
            <Link to="/add-listing" className="text-primary hover:underline mt-1 inline-block text-xs">
              Be the first to add a business!
            </Link>
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="bg-secondary-100 rounded-lg p-4 text-center">
        <h2 className="text-lg font-bold mb-1">Have something to sell?</h2>
        <p className="mb-3 text-secondary-600 text-sm">
          List your products or business on Campus Marketplace and reach students on your campus.
        </p>
        <Link to="/add-listing" className="btn btn-primary inline-block text-sm py-1.5">
          Add Listing
        </Link>
      </section>
    </div>
  )
}

export default HomePage

