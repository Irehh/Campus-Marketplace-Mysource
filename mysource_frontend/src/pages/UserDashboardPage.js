"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiShoppingBag, FiGrid, FiAlertTriangle, FiSearch } from "react-icons/fi"
import toast from "react-hot-toast"

const UserDashboardPage = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDisabled, setFilterDisabled] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchUserListings = async () => {
      setLoading(true)
      try {
        // Make sure the endpoints exist and are correctly called
        const productsPromise = axios.get("/api/products/user", {
          headers: { Authorization: `Bearer ${token}` },
        })

        const businessesPromise = axios.get("/api/businesses/user", {
          headers: { Authorization: `Bearer ${token}` },
        })

        // Use Promise.allSettled instead of Promise.all to handle partial failures
        const [productsResult, businessesResult] = await Promise.allSettled([productsPromise, businessesPromise])

        // Handle products result
        if (productsResult.status === "fulfilled") {
          setProducts(productsResult.value.data.products || [])
        } else {
          console.error("Error fetching products:", productsResult.reason)
          setProducts([])
        }

        // Handle businesses result
        if (businessesResult.status === "fulfilled") {
          setBusinesses(businessesResult.value.data.businesses || [])
        } else {
          console.error("Error fetching businesses:", businessesResult.reason)
          setBusinesses([])
        }
      } catch (error) {
        console.error("Error fetching user listings:", error)
        toast.error("Failed to load your listings. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchUserListings()
    }
  }, [token])

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return

    try {
      await axios.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setProducts(products.filter((product) => product.id !== id))
      toast.success("Product deleted successfully")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    }
  }

  const handleDeleteBusiness = async (id) => {
    if (!window.confirm("Are you sure you want to delete this business?")) return

    try {
      await axios.delete(`/api/businesses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setBusinesses(businesses.filter((business) => business.id !== id))
      toast.success("Business deleted successfully")
    } catch (error) {
      console.error("Error deleting business:", error)
      toast.error("Failed to delete business")
    }
  }

  // Filter products based on search term and disabled status
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchTerm === "" || product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDisabledFilter = !filterDisabled || product.isDisabled
    return matchesSearch && (filterDisabled ? product.isDisabled : true)
  })

  // Filter businesses based on search term and disabled status
  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      searchTerm === "" ||
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDisabledFilter = !filterDisabled || business.isDisabled
    return matchesSearch && (filterDisabled ? business.isDisabled : true)
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <Link to="/add-listing" className="btn btn-primary flex items-center text-sm">
          <FiPlus className="mr-1" /> Add Listing
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search your listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filterDisabled}
              onChange={() => setFilterDisabled(!filterDisabled)}
              className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-700">Show disabled only</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex -mb-px">
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "products" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            <FiShoppingBag className="inline mr-1" />
            My Products
            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{products.length}</span>
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "businesses"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("businesses")}
          >
            <FiGrid className="inline mr-1" />
            My Businesses
            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{businesses.length}</span>
          </button>
        </div>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div>
          {products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">You haven't added any products yet.</p>
              <Link to="/add-listing" className="btn btn-primary inline-flex items-center">
                <FiPlus className="mr-1" /> Add Your First Product
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No products match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={`hover:bg-gray-50 ${product.isDisabled ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-md object-cover"
                              src={
                                product.images && product.images.length > 0
                                  ? product.images[0].thumbnailUrl
                                  : "/placeholder.svg"
                              }
                              alt={product.description}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {product.description.substring(0, 50)}
                              {product.description.length > 50 ? "..." : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.price ? `₦${product.price.toLocaleString()}` : "Not specified"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiEye className="mr-1 text-gray-400" />
                          {product.viewCount || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {product.isDisabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <FiAlertTriangle className="mr-1" size={10} />
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/products/${product.id}`}
                            className="text-primary hover:text-primary-dark"
                            title="View"
                          >
                            <FiEye />
                          </Link>
                          <Link
                            to={`/edit-product/${product.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Businesses Tab */}
      {activeTab === "businesses" && (
        <div>
          {businesses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">You haven't added any businesses yet.</p>
              <Link to="/add-listing" className="btn btn-primary inline-flex items-center">
                <FiPlus className="mr-1" /> Add Your First Business
              </Link>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No businesses match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBusinesses.map((business) => (
                    <tr key={business.id} className={`hover:bg-gray-50 ${business.isDisabled ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-md object-cover"
                              src={
                                business.images && business.images.length > 0
                                  ? business.images[0].thumbnailUrl
                                  : "/placeholder.svg"
                              }
                              alt={business.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{business.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {business.category || "Uncategorized"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiEye className="mr-1 text-gray-400" />
                          {business.viewCount || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {business.isDisabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <FiAlertTriangle className="mr-1" size={10} />
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/businesses/${business.id}`}
                            className="text-primary hover:text-primary-dark"
                            title="View"
                          >
                            <FiEye />
                          </Link>
                          <Link
                            to={`/edit-business/${business.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            onClick={() => handleDeleteBusiness(business.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserDashboardPage

