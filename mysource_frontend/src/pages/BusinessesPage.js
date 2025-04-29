// Update the BusinessesPage to handle campus filtering correctly


import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import BusinessCard from "../components/BusinessCard"
import { FiFilter } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"

const BusinessesPage = () => {
  const { isAuthenticated, user } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [category, setCategory] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { value: "", label: "All Categories" },
    { value: "food", label: "Food & Beverages" },
    { value: "retail", label: "Retail" },
    { value: "services", label: "Services" },
    { value: "tech", label: "Technology" },
    { value: "other", label: "Other" },
  ]

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true)
      try {
        // Get campus from user if authenticated, otherwise from cookie
        const campus = isAuthenticated ? user.campus : Cookies.get("userCampus") || ""

        const response = await axios.get("/api/businesses", {
          params: {
            campus,
            category: category || undefined,
            page,
            limit: 12,
          },
        })

        setBusinesses(response.data.businesses)
        setTotalPages(response.data.pagination.totalPages)
      } catch (error) {
        console.error("Error fetching businesses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [page, category, isAuthenticated, user])

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setPage(1) // Reset to first page when changing category
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo(0, 0)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campus Businesses</h1>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-secondary-700 hover:text-primary md:hidden"
        >
          <FiFilter className="mr-1" /> Filters
        </button>

        <div className="hidden md:block">
          <select value={category} onChange={handleCategoryChange} className="input max-w-xs">
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Filters */}
      {showFilters && (
        <div className="mb-4 p-4 border border-secondary-200 rounded-md bg-white md:hidden">
          <div className="mb-2">
            <label htmlFor="category-mobile" className="label">
              Category
            </label>
            <select id="category-mobile" value={category} onChange={handleCategoryChange} className="input">
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {businesses.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {businesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary-50 rounded-lg">
              <p className="text-secondary-600 mb-2">No businesses found.</p>
              <p className="text-sm text-secondary-500">Try changing your filters or campus selection.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 rounded border ${
                      page === i + 1 ? "bg-primary text-white border-primary" : "border-secondary-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BusinessesPage

