

import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import { useAuth } from "../contexts/AuthContext"
import ProductCard from "../components/ProductCard"
import BusinessCard from "../components/BusinessCard"
import { FiSearch, FiGrid, FiShoppingBag, FiEye, FiAlertCircle } from "react-icons/fi"
import toast from "react-hot-toast"

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const query = searchParams.get("q") || ""
  const [searchType, setSearchType] = useState("all")
  const [results, setResults] = useState({ products: [], businesses: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalResults, setTotalResults] = useState(0)
  const [totalViews, setTotalViews] = useState({ products: 0, businesses: 0 })

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Get campus from user if authenticated, otherwise from cookie
        const campus = isAuthenticated ? user?.campus : Cookies.get("userCampus") || ""

        const response = await axios.get("/api/search", {
          params: {
            q: query,
            type: searchType,
            campus,
          },
        })

        setResults(response.data)

        // Calculate total results
        const productsCount = response.data.products?.length || 0
        const businessesCount = response.data.businesses?.length || 0
        setTotalResults(productsCount + businessesCount)

        // Calculate total views
        const productViews = response.data.products?.reduce((sum, product) => sum + (product.viewCount || 0), 0) || 0
        const businessViews =
          response.data.businesses?.reduce((sum, business) => sum + (business.viewCount || 0), 0) || 0
        setTotalViews({
          products: productViews,
          businesses: businessViews,
        })
      } catch (error) {
        console.error("Error searching:", error)
        setError("Failed to fetch search results. Please try again.")
        toast.error("Search failed. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query, searchType, isAuthenticated, user])

  const handleSearchTypeChange = (type) => {
    setSearchType(type)
  }

  if (!query.trim() && !loading) {
    return (
      <div className="text-center py-12">
        <FiSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">Search for products and businesses</h2>
        <p className="text-gray-600 mb-4">Enter a search term to find what you're looking for</p>
        <form
          action="/search"
          className="max-w-md mx-auto flex"
          onSubmit={(e) => {
            e.preventDefault()
            const input = e.target.elements.q
            if (input.value.trim()) {
              window.location.href = `/search?q=${encodeURIComponent(input.value)}`
            }
          }}
        >
          <input
            type="text"
            name="q"
            placeholder="Search..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark">
            <FiSearch />
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Search Results for "{query}"</h1>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-gray-600">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""}
            {totalResults > 0 && (
              <span className="ml-2 flex items-center text-xs">
                <FiEye className="mr-1" />
                {totalViews.products + totalViews.businesses} total views
              </span>
            )}
          </div>

          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${searchType === "all" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => handleSearchTypeChange("all")}
            >
              All
            </button>
            <button
              className={`px-3 py-1 text-sm flex items-center ${searchType === "products" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => handleSearchTypeChange("products")}
            >
              <FiShoppingBag className="mr-1" size={14} />
              Products
              {results.products?.length > 0 && <span className="ml-1 text-xs">({results.products.length})</span>}
            </button>
            <button
              className={`px-3 py-1 text-sm flex items-center ${searchType === "businesses" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => handleSearchTypeChange("businesses")}
            >
              <FiGrid className="mr-1" size={14} />
              Businesses
              {results.businesses?.length > 0 && <span className="ml-1 text-xs">({results.businesses.length})</span>}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-sm">Please check your connection and try again.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Products Section */}
          {(searchType === "all" || searchType === "products") && results.products?.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiShoppingBag className="mr-2" /> Products
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({results.products.length} result{results.products.length !== 1 ? "s" : ""})
                  </span>
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <FiEye className="mr-1" />
                  {totalViews.products} views
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Businesses Section */}
          {(searchType === "all" || searchType === "businesses") && results.businesses?.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiGrid className="mr-2" /> Businesses
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({results.businesses.length} result{results.businesses.length !== 1 ? "s" : ""})
                  </span>
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <FiEye className="mr-1" />
                  {totalViews.businesses} views
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.businesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {totalResults === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-bold mb-2">No results found</h2>
              <p className="text-gray-600 mb-4">
                We couldn't find any matches for "{query}". Please try another search term.
              </p>
              <div className="flex justify-center space-x-4">
                <Link to="/products" className="text-primary hover:underline">
                  Browse Products
                </Link>
                <Link to="/businesses" className="text-primary hover:underline">
                  Browse Businesses
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchPage

