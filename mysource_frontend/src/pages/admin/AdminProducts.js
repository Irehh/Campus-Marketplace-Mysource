

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import { FiSearch, FiEye, FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi"
import toast from "react-hot-toast"

const AdminProducts = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCampus, setSelectedCampus] = useState("")
  const [showDisabledOnly, setShowDisabledOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
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

    const fetchProducts = async () => {
      try {
        let endpoint = "/api/products"
        let params = {
          search,
          campus: selectedCampus,
          page,
          limit: 10,
        }

        // If showing disabled only, use the admin endpoint
        if (showDisabledOnly) {
          endpoint = "/api/admin/disabled-products"
          params = {
            campus: selectedCampus,
          }
        }

        const response = await axios.get(endpoint, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        })

        if (showDisabledOnly) {
          setProducts(response.data)
          setTotalPages(1) // No pagination for disabled products endpoint
        } else {
          setProducts(response.data.products)
          setTotalPages(response.data.pagination.totalPages)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        toast.error("Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchProducts()
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

  const openDisableModal = (product) => {
    setSelectedProduct(product)
    setDisableReason("")
    setShowDisableModal(true)
  }

  const handleDisableProduct = async () => {
    if (!disableReason.trim()) {
      toast.error("Please provide a reason for disabling this product")
      return
    }

    try {
      await axios.post(
        `/api/admin/products/${selectedProduct.id}/disable`,
        { reason: disableReason },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success("Product has been disabled")

      // Update product in the list
      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id ? { ...p, isDisabled: true, disabledReason: disableReason } : p,
        ),
      )

      setShowDisableModal(false)
    } catch (error) {
      console.error("Error disabling product:", error)
      toast.error("Failed to disable product")
    }
  }

  const handleEnableProduct = async (productId) => {
    try {
      await axios.post(`/api/admin/products/${productId}/enable`, {}, { headers: { Authorization: `Bearer ${token}` } })

      toast.success("Product has been enabled")

      if (showDisabledOnly) {
        // Remove from list if showing only disabled
        setProducts(products.filter((p) => p.id !== productId))
      } else {
        // Update in the list
        setProducts(products.map((p) => (p.id === productId ? { ...p, isDisabled: false, disabledReason: null } : p)))
      }
    } catch (error) {
      console.error("Error enabling product:", error)
      toast.error("Failed to enable product")
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
        <h1 className="text-2xl font-bold">Manage Products</h1>
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
                placeholder="Search products..."
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
            <span className="ml-2 text-sm text-gray-700">Show disabled products only</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative">
                <img
                  src={product.images && product.images.length > 0 ? product.images[0].url : "/placeholder.svg"}
                  alt={product.description}
                  className="w-full h-40 object-cover"
                />
                {product.isDisabled && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs">Disabled</div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">
                  {product.description.substring(0, 50)}
                  {product.description.length > 50 ? "..." : ""}
                </h3>

                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {product.campus} • {product.category || "Uncategorized"}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {product.price ? `₦${product.price.toLocaleString()}` : "No price"}
                  </div>
                </div>

                {product.isDisabled && product.disabledReason && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    <span className="font-medium">Reason:</span> {product.disabledReason}
                  </div>
                )}

                <div className="mt-3 flex justify-between">
                  <Link
                    to={`/products/${product.id}`}
                    className="inline-flex items-center text-xs text-primary hover:underline"
                  >
                    <FiEye className="mr-1" size={14} />
                    View Details
                  </Link>

                  <div>
                    {product.isDisabled ? (
                      <button
                        onClick={() => handleEnableProduct(product.id)}
                        className="inline-flex items-center text-xs text-green-600 hover:text-green-800"
                      >
                        <FiCheckCircle className="mr-1" size={14} />
                        Enable
                      </button>
                    ) : (
                      <button
                        onClick={() => openDisableModal(product)}
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

      {/* Disable Product Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start mb-4">
              <FiAlertTriangle className="text-red-500 mr-3 mt-0.5 h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold text-red-700">Disable Product</h2>
                <p className="text-gray-600 mt-1">
                  This product will be hidden from other users but will still be visible to the owner.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for disabling</label>
              <textarea
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder="Explain why this product is being disabled..."
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
                onClick={handleDisableProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Disable Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts

