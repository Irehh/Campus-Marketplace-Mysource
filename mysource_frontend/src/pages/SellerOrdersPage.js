"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FiPackage, FiEye, FiFilter, FiTruck, FiCheck } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import PageHeader from "../components/PageHeader"
import EmptyState from "../components/EmptyState"
import Loader from "../components/Loader"

const SellerOrdersPage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({})
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingStatus, setUpdatingStatus] = useState(new Set())

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, statusFilter, currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      })

      if (statusFilter) {
        params.append("status", statusFilter)
      }

      const response = await api.get(`/orders/seller?${params}`)

      if (response.data.success) {
        setOrders(response.data.data.orders)
        setPagination(response.data.data.pagination)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const updateDeliveryStatus = async (orderId, newStatus) => {
    setUpdatingStatus((prev) => new Set(prev).add(orderId))

    try {
      const response = await api.put(`/orders/${orderId}/delivery-status`, {
        deliveryStatus: newStatus,
        sellerNotes: `Status updated to ${newStatus}`,
      })

      if (response.data.success) {
        toast.success("Delivery status updated successfully")
        await fetchOrders()
      }
    } catch (error) {
      console.error("Error updating delivery status:", error)
      toast.error(error.response?.data?.message || "Failed to update status")
    } finally {
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "ready_for_pickup":
        return "bg-blue-100 text-blue-800"
      case "in_transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "confirmed_by_buyer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDeliveryStatus = (status) => {
    switch (status) {
      case "ready_for_pickup":
        return "Ready for Pickup"
      case "in_transit":
        return "In Transit"
      case "confirmed_by_buyer":
        return "Confirmed"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getNextDeliveryStatus = (currentStatus) => {
    const statusFlow = {
      pending: "preparing",
      preparing: "ready_for_pickup",
      ready_for_pickup: "in_transit",
      in_transit: "delivered",
    }
    return statusFlow[currentStatus]
  }

  const getStatusActionLabel = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return "Start Preparing"
      case "preparing":
        return "Mark Ready"
      case "ready_for_pickup":
        return "Mark In Transit"
      case "in_transit":
        return "Mark Delivered"
      default:
        return null
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={FiPackage}
          title="Sign in to view your orders"
          description="You need to be signed in to manage your seller orders."
          actionText="Sign In"
          actionLink="/login"
        />
      </div>
    )
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Seller Orders" subtitle="Manage your sales and delivery status" />

        <Link
          to="/orders"
          className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100"
        >
          <FiPackage className="mr-2" size={16} />
          My Orders
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <EmptyState
          icon={FiTruck}
          title="No orders found"
          description={
            statusFilter ? `No orders with status "${statusFilter}"` : "You haven't received any orders yet."
          }
          actionText="View Products"
          actionLink="/dashboard"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const nextStatus = getNextDeliveryStatus(order.deliveryStatus)
            const actionLabel = getStatusActionLabel(order.deliveryStatus)
            const canUpdateStatus = nextStatus && !["completed", "cancelled"].includes(order.status)

            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                      <p className="text-sm text-gray-500">Customer: {order.buyer?.name}</p>
                    </div>

                    <div className="text-right">
                      <div className="flex space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(order.deliveryStatus)}`}
                        >
                          {formatDeliveryStatus(order.deliveryStatus)}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-primary">₦{Number(order.subtotal).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">(Total: ₦{Number(order.totalAmount).toLocaleString()})</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-2">
                        {order.OrderItems?.slice(0, 3).map((item, index) => (
                          <img
                            key={index}
                            src={item.Product?.Images?.[0]?.url || "/placeholder.svg?height=40&width=40"}
                            alt={item.Product?.title}
                            className="w-10 h-10 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                        {order.OrderItems?.length > 3 && (
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            +{order.OrderItems.length - 3}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          {order.OrderItems?.length} item{order.OrderItems?.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.deliveryMethod === "pickup" ? "Campus Pickup" : "Delivery"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {canUpdateStatus && (
                        <button
                          onClick={() => updateDeliveryStatus(order.id, nextStatus)}
                          disabled={updatingStatus.has(order.id)}
                          className="flex items-center text-sm bg-green-50 text-green-700 px-3 py-2 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatus.has(order.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <FiCheck className="mr-1" size={16} />
                              {actionLabel}
                            </>
                          )}
                        </button>
                      )}

                      <Link
                        to={`/orders/${order.id}`}
                        className="flex items-center text-sm text-primary hover:text-primary-600 font-medium"
                      >
                        <FiEye className="mr-1" size={16} />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="px-3 py-2 text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            disabled={!pagination.hasNext}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default SellerOrdersPage
