"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import ProductCard from "../components/ProductCard"
import BusinessCard from "../components/BusinessCard"
import { FiSearch, FiShoppingBag, FiGrid } from "react-icons/fi"

const HomePage = () => {
  const [products, setProducts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campus = Cookies.get("userCampus") || ""

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
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-lg p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Campus Marketplace</h1>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Find products and businesses on your campus. Buy, sell, and discover local services.
        </p>

        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search products or businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
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

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <FiShoppingBag className="mr-2" /> Featured Products
          </h2>
          <Link to="/products" className="text-primary hover:underline text-sm">
            View all
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600">No products found.</p>
            <Link to="/add-listing" className="text-primary hover:underline mt-2 inline-block">
              Be the first to add a product!
            </Link>
          </div>
        )}
      </section>

      {/* Featured Businesses */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <FiGrid className="mr-2" /> Campus Businesses
          </h2>
          <Link to="/businesses" className="text-primary hover:underline text-sm">
            View all
          </Link>
        </div>

        {businesses.length > 0 ? (
          <div className="space-y-4">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600">No businesses found.</p>
            <Link to="/add-listing" className="text-primary hover:underline mt-2 inline-block">
              Be the first to add a business!
            </Link>
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="bg-secondary-100 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Have something to sell?</h2>
        <p className="mb-4 text-secondary-600">
          List your products or business on Campus Marketplace and reach students on your campus.
        </p>
        <Link to="/add-listing" className="btn btn-primary inline-block">
          Add Listing
        </Link>
      </section>
    </div>
  )
}

export default HomePage

