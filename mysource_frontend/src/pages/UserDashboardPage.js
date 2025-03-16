"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiShoppingBag, FiGrid } from "react-icons/fi"
import toast from "react-hot-toast"

const UserDashboardPage = () => {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserListings = async () => {
      setLoading(true)
      try {
        const [productsRes, businessesRes] = await Promise.all([
          axios.get("/api/products/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/businesses/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        setProducts(productsRes.data.products || [])
        setBusinesses(businessesRes.data.businesses || [])
      } catch (error) {
        console.error("Error fetching user listings:", error)
        toast.error("Failed to load your listings")
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
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

