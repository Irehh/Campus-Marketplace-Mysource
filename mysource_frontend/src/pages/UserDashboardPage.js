"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FiEdit, FiTrash, FiPlus, FiBell, FiSettings } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import toast from "react-hot-toast"

const UserDashboardPage = () => {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState("")

  // Use your existing API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        setLoading(true)

        // Fetch user's products
        const productsResponse = await axios.get(`${API_BASE_URL}/products/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        // Check if the response has the expected structure
        if (productsResponse.data && productsResponse.data.products) {
          setProducts(productsResponse.data.products)
        } else if (Array.isArray(productsResponse.data)) {
          // Handle case where the API returns an array directly
          setProducts(productsResponse.data)
        } else {
          console.error("Unexpected products response format:", productsResponse.data)
          setProducts([])
        }

        // Fetch user's businesses
        const businessesResponse = await axios.get(`${API_BASE_URL}/businesses/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        // Check if the response has the expected structure
        if (businessesResponse.data && businessesResponse.data.businesses) {
          setBusinesses(businessesResponse.data.businesses)
        } else if (Array.isArray(businessesResponse.data)) {
          // Handle case where the API returns an array directly
          setBusinesses(businessesResponse.data)
        } else {
          console.error("Unexpected businesses response format:", businessesResponse.data)
          setBusinesses([])
        }
      } catch (error) {
        console.error("Error fetching user listings:", error)
        toast.error("Failed to load your listings")
      } finally {
        setLoading(false)
      }
    }

    if (user && token) {
      fetchUserListings()
    }
  }, [user, token, API_BASE_URL])

  const handleDeleteClick = (item, type) => {
    setItemToDelete(item)
    setDeleteType(type)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === "product") {
        await axios.delete(`${API_BASE_URL}/products/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProducts(products.filter((p) => p.id !== itemToDelete.id))
        toast.success("Product deleted successfully")
      } else if (deleteType === "business") {
        await axios.delete(`${API_BASE_URL}/businesses/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBusinesses(businesses.filter((b) => b.id !== itemToDelete.id))
        toast.success("Business deleted successfully")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    } finally {
      setShowDeleteDialog(false)
      setItemToDelete(null)
    }
  }

  const renderListingCard = (item, type) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : "/placeholder.svg"
    const editUrl = type === "product" ? `/edit-product/${item.id}` : `/edit-business/${item.id}`
    const detailUrl = type === "product" ? `/products/${item.id}` : `/businesses/${item.id}`
    const isDisabled = item.isDisabled === true

    return (
      <div key={item.id} className={`bg-white rounded-lg shadow-sm overflow-hidden ${isDisabled ? "opacity-60" : ""}`}>
        <div className="relative h-32">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={item.name || item.description}
            className="w-full h-full object-cover"
          />
          {isDisabled && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Disabled</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-md font-semibold truncate">{item.name || item.description}</h3>
          <p className="text-gray-600 text-xs mb-1 truncate">{item.category || "Uncategorized"}</p>

          {type === "product" && item.price && (
            <p className="text-primary font-bold mb-2 text-sm">₦{item.price.toLocaleString()}</p>
          )}

          <div className="flex justify-between items-center">
            <Link to={detailUrl} className="text-blue-600 hover:text-blue-800 text-xs">
              View
            </Link>
            <div className="flex space-x-1">
              <Link to={editUrl} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Edit">
                <FiEdit size={14} />
              </Link>
              <button
                onClick={() => handleDeleteClick(item, type)}
                className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                title="Delete"
              >
                <FiTrash size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">My Dashboard</h1>
        <div className="flex space-x-2">
          <Link
            to="/notification-settings"
            className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100"
          >
            <FiBell className="mr-1" size={14} />
            Notification Settings
          </Link>
          <Link
            to="/profile"
            className="flex items-center text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200"
          >
            <FiSettings className="mr-1" size={14} />
            Profile Settings
          </Link>
        </div>
      </div>

      {/* Products Section */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">My Products</h2>
          <Link
            to="/add-listing"
            className="bg-primary text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-primary-dark"
          >
            <FiPlus className="mr-1" size={12} /> Add
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
            You haven't listed any products yet
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => renderListingCard(product, "product"))}
          </div>
        )}
      </section>

      {/* Businesses Section */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">My Businesses</h2>
          <Link
            to="/add-listing"
            className="bg-primary text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-primary-dark"
          >
            <FiPlus className="mr-1" size={12} /> Add
          </Link>
        </div>

        {businesses.length === 0 ? (
          <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
            You haven't listed any businesses yet
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {businesses.map((business) => renderListingCard(business, "business"))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-xs w-full">
            <h3 className="text-md font-bold mb-2">Delete {deleteType === "product" ? "Product" : "Business"}</h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to delete "{itemToDelete?.name || itemToDelete?.description}"?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboardPage

