

import { Link, useNavigate } from "react-router-dom"
import { FiHome, FiSearch, FiShoppingBag, FiGrid, FiArrowLeft } from "react-icons/fi"
import { useState } from "react"

const NotFoundPage = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const goBack = () => {
    navigate(-1)
  }

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="mb-8">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Page Not Found</h2>
        <p className="text-gray-600">The page you are looking for doesn't exist or has been moved.</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Search for something?</h3>
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or businesses..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark">
              <FiSearch />
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Or try these pages</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/"
              className="flex items-center justify-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <FiHome className="mr-2" />
              Home
            </Link>
            <Link
              to="/products"
              className="flex items-center justify-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <FiShoppingBag className="mr-2" />
              Products
            </Link>
            <Link
              to="/businesses"
              className="flex items-center justify-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <FiGrid className="mr-2" />
              Businesses
            </Link>
            <button
              onClick={goBack}
              className="flex items-center justify-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <FiArrowLeft className="mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage

