"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import { FiSearch, FiEye, FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi"
import toast from "react-hot-toast"

const AdminBusinesses = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCampus, setSelectedCampus] = useState("")
  const [showDisabledOnly, setShowDisabledOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [disableReason, setDisableReason] = useState("")

  // Campus options
  const campusOptions = [
    { value: "", label: "All Campuses" },
    { value: "unilag", label: "University of Lagos" },
    { value: "uniben", label: "University of Benin" },
    { value: "ui", label: "University of Ibadan" },
    { value: "oau", label: "Obafemi Awolowo University" },
    { value: "uniport", label: "University of Port Harcourt" },
  ]

  useEffect(() => {
    // Redirect if not an admin
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      toast.error("You don't have permission to access this page")
      navigate("/")
      return
    }

    const fetchBusinesses = async () => {
      try {
        let endpoint = "/api/businesses"
        let params = {
          search,
          campus: selectedCampus,
          page,
          limit: 10,
        }

        // If showing disabled only, use the admin endpoint
        if (showDisabledOnly) {
          endpoint = "/api/admin/disabled-businesses"
          params = {
            campus: selectedCampus,
          }
        }

        const response = await axios.get(endpoint, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        })

        if (showDisabledOnly) {
          setBusinesses(response.data)
          setTotalPages(1) // No pagination for disabled businesses endpoint
        } else {
          setBusinesses(response.data.businesses)
          setTotalPages(response.data.pagination.totalPages)
        }
      } catch (error) {
        console.error("Error fetching businesses:", error)
        toast.error("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchBusinesses()
    }
  }, [token, user, navigate, search, selectedCampus, showDisabledOnly, page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1) // Reset to first page when searching
  }

  const handleCampusChange = (e) => {
    setSelectedCampus(e.target.value)
    setPage(1) // Reset to first page when changing campus
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo(0, 0)
  }

  const openDisableModal = (business) => {
    setSelectedBusiness(business)
    setDisableReason("")
    setShowDisableModal(true)
  }

  const handleDisableBusiness = async () => {
    if (!disableReason.trim()) {
      toast.error("Please provide a reason for disabling this business")
      return
    }

    try {
      await axios.post(
        `/api/admin/businesses/${selectedBusiness.id}/disable`,
        { reason: disableReason },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Business has been disabled")

      // Update business in the list
      setBusinesses(
        businesses.map((b) =>
          b.id === selectedBusiness.id ? { ...b, isDisabled: true, disabledReason: disableReason } : b,
        ),
      )

      setShowDisableModal(false)
    } catch (error) {
      console.error("Error disabling business:", error)
      toast.error("Failed to disable business")
    }
  }

  const handleEnableBusiness = async (businessId) => {
    try {
      await axios.post(
        `/api/admin/businesses/${businessId}/enable`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Business has been enabled")

      if (showDisabledOnly) {
        // Remove from list if showing only disabled
        setBusinesses(businesses.filter((b) => b.id !== businessId))
      } else {
        // Update in the list
        setBusinesses(
          businesses.map((b) => (b.id === businessId ? { ...b, isDisabled: false, disabledReason: null } : b)),
        )
      }
    } catch (error) {
      console.error("Error enabling business:", error)
      toast.error("Failed to enable business")
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Businesses</h1>
        <button onClick={() => navigate("/admin/dashboard")} className="text-primary hover:underline text-sm">
          Back to Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Search businesses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={showDisabledOnly}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary"
                disabled={showDisabledOnly}
              >
                Search
              </button>
            </div>
          </form>

          <div className="w-full md:w-64">
            <select
              value={selectedCampus}
              onChange={handleCampusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {campusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showDisabledOnly}
              onChange={() => setShowDisabledOnly(!showDisabledOnly)}
              className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-700">Show disabled businesses only</span>
          </label>
        </div>
      </div>

      {/* Businesses Grid */}
      {businesses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">No businesses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((business) => (
            <div key={business.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative">
                <img
                  src={business.images && business.images.length > 0 ? business.images[0].url : "/placeholder.svg"}
                  alt={business.name}
                  className="w-full h-40 object-cover"
                />
                {business.isDisabled && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs">Disabled</div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{business.name}</h3>

                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {business.campus} • {business.category || "Uncategorized"}
                  </div>
                </div>

                {business.isDisabled && business.disabledReason && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    <span className="font-medium">Reason:</span> {business.disabledReason}
                  </div>
                )}

                <div className="mt-3 flex justify-between">
                  <Link
                    to={`/businesses/${business.id}`}
                    className="inline-flex items-center text-xs text-primary hover:underline"
                  >
                    <FiEye className="mr-1" size={14} />
                    View Details
                  </Link>

                  <div>
                    {business.isDisabled ? (
                      <button
                        onClick={() => handleEnableBusiness(business.id)}
                        className="inline-flex items-center text-xs text-green-600 hover:text-green-800"
                      >
                        <FiCheckCircle className="mr-1" size={14} />
                        Enable
                      </button>
                    ) : (
                      <button
                        onClick={() => openDisableModal(business)}
                        className="inline-flex items-center text-xs text-red-600 hover:text-red-800"
                      >
                        <FiXCircle className="mr-1" size={14} />
                        Disable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!showDisabledOnly && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded border ${
                  page === i + 1 ? "bg-primary text-white border-primary" : "border-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Disable Business Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start mb-4">
              <FiAlertTriangle className="text-red-500 mr-3 mt-0.5 h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold text-red-700">Disable Business</h2>
                <p className="text-gray-600 mt-1">
                  This business will be hidden from other users but will still be visible to the owner.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for disabling</label>
              <textarea
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder="Explain why this business is being disabled..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                rows="3"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDisableModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableBusiness}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Disable Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBusinesses

