"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { FiFilter, FiPlus } from "react-icons/fi"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import GigCard from "../components/GigCard"
import Loader from "../components/Loader"
import EmptyState from "../components/EmptyState"
import PageHeader from "../components/PageHeader"

const GigsPage = () => {
  const { isAuthenticated, user } = useAuth()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Add budget range filter
  const [minBudget, setMinBudget] = useState("")
  const [maxBudget, setMaxBudget] = useState("")
  const [duration, setDuration] = useState("")

  const categories = [
    { value: "", label: "All Categories" },
    { value: "design", label: "Design" },
    { value: "writing", label: "Writing" },
    { value: "programming", label: "Programming" },
    { value: "marketing", label: "Marketing" },
    { value: "tutoring", label: "Tutoring" },
    { value: "errands", label: "Errands" },
    { value: "labor", label: "Labor" },
    { value: "other", label: "Other" },
  ]

  const statuses = [
    { value: "", label: "All Statuses" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ]

  useEffect(() => {
    const fetchGigs = async () => {
      setLoading(true)
      try {
        // If authenticated, use the user's campus and don't allow changing it
        const campus = isAuthenticated && user ? user.campus : Cookies.get("userCampus") || ""

        const response = await axios.get("/api/gigs", {
          params: {
            campus,
            category: category || undefined,
            status: status || undefined,
            minBudget: minBudget || undefined,
            maxBudget: maxBudget || undefined,
            duration: duration || undefined,
            page,
            limit: 12,
          },
        })

        setGigs(response.data.data || [])
        setTotalPages(response.data.totalPages || 1)
      } catch (error) {
        console.error("Error fetching gigs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGigs()
  }, [page, category, status, minBudget, maxBudget, duration, isAuthenticated, user])

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setPage(1) // Reset to first page when changing category
  }

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    setPage(1) // Reset to first page when changing status
  }

  const handleMinBudgetChange = (e) => {
    setMinBudget(e.target.value)
    setPage(1)
  }

  const handleMaxBudgetChange = (e) => {
    setMaxBudget(e.target.value)
    setPage(1)
  }

  const handleDurationChange = (e) => {
    setDuration(e.target.value)
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo(0, 0)
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <PageHeader title="Campus Gigs" />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Gigs</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-4 flex items-center text-secondary-700 hover:text-primary md:hidden"
          >
            <FiFilter className="mr-1" /> Filters
          </button>
        </div>

        <div className="flex space-x-2">
          <div className="hidden md:flex space-x-2">
            <select value={category} onChange={handleCategoryChange} className="input max-w-xs">
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select value={status} onChange={handleStatusChange} className="input max-w-xs">
              {statuses.map((stat) => (
                <option key={stat.value} value={stat.value}>
                  {stat.label}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-1">
              <input
                type="number"
                placeholder="Min ₦"
                value={minBudget}
                onChange={handleMinBudgetChange}
                className="input w-20"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max ₦"
                value={maxBudget}
                onChange={handleMaxBudgetChange}
                className="input w-20"
              />
            </div>

            <select value={duration} onChange={handleDurationChange} className="input max-w-xs">
              <option value="">Any Duration</option>
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">1 Week</option>
              <option value="14">2 Weeks</option>
              <option value="30">1 Month</option>
            </select>
          </div>

          <Link to="/gigs/create" className="btn-primary flex items-center">
            <FiPlus className="mr-1" /> Post Gig
          </Link>
        </div>
      </div>

      {/* Campus selector for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-1">Campus</h3>
          <select
            value={Cookies.get("userCampus") || ""}
            onChange={(e) => {
              Cookies.set("userCampus", e.target.value, { expires: 30 })
              // Refresh the page to get gigs for the selected campus
              window.location.reload()
            }}
            className="input"
          >
            <option value="">All Campuses</option>
            <option value="unilag">UNILAG</option>
            <option value="uniben">UNIBEN</option>
            <option value="ui">UI</option>
            <option value="oau">OAU</option>
            <option value="uniport">UNIPORT</option>
          </select>
        </div>
      )}

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
          <div className="mb-2">
            <label htmlFor="status-mobile" className="label">
              Status
            </label>
            <select id="status-mobile" value={status} onChange={handleStatusChange} className="input">
              {statuses.map((stat) => (
                <option key={stat.value} value={stat.value}>
                  {stat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label htmlFor="min-budget-mobile" className="label">
              Budget Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="min-budget-mobile"
                type="number"
                placeholder="Min ₦"
                value={minBudget}
                onChange={handleMinBudgetChange}
                className="input w-full"
              />
              <span>-</span>
              <input
                id="max-budget-mobile"
                type="number"
                placeholder="Max ₦"
                value={maxBudget}
                onChange={handleMaxBudgetChange}
                className="input w-full"
              />
            </div>
          </div>

          <div className="mb-2">
            <label htmlFor="duration-mobile" className="label">
              Duration
            </label>
            <select id="duration-mobile" value={duration} onChange={handleDurationChange} className="input">
              <option value="">Any Duration</option>
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">1 Week</option>
              <option value="14">2 Weeks</option>
              <option value="30">1 Month</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <>
          {gigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No gigs found"
              description="Try changing your filters or campus selection."
              action={
                <Link to="/gigs/create" className="btn-primary">
                  Post a Gig
                </Link>
              }
            />
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

export default GigsPage
