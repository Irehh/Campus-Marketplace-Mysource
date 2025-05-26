"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { FiArrowLeft, FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiUser } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import PageHeader from "../components/PageHeader"
import Loader from "../components/Loader"

const OrderDetailPage = () => {
  const { orderId } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    if (orderId && user) {
      fetchOrderDetails()
    }
  }, [orderId, user])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/orders/${orderId}`)

      if (response.data.success) {
        setOrder(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast.error("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const confirmDelivery = async () => {
    if (!window.confirm("Are you sure you want to confirm delivery? This will release payment to the seller.")) {
      return
    }

    setConfirmingDelivery(true)

    try {
      const response = await api.put(`/orders/${orderId}/confirm-delivery`, {
        buyerNotes: "Delivery confirmed by buyer",
      })

      if (response.data.success) {
        toast.success("Delivery confirmed! Payment has been released to the seller.")
        await fetchOrderDetails()
      }
    } catch (error) {
      console.error("Error confirming delivery:", error)
      toast.error(error.response?.data?.message || "Failed to confirm delivery")
    } finally {
      setConfirmingDelivery(false)
    }
  }

  const cancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation")
      return
    }

    setCancelling(true)

    try {
      const response = await api.put(`/orders/${orderId}/cancel`, {
        reason: cancelReason,
      })

      if (response.data.success) {
        toast.success("Order cancelled successfully")
        await fetchOrderDetails()
        setShowCancelDialog(false)
        setCancelReason("")
      }
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast.error(error.response?.data?.message || "Failed to cancel order")
    } finally {
      setCancelling(false)
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

  const getDeliveryStatusSteps = () => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: FiPackage },
      { key: "confirmed", label: "Confirmed", icon: FiCheckCircle },
      { key: "preparing", label: "Preparing", icon: FiClock },
      { key: "ready_for_pickup", label: "Ready for Pickup", icon: FiMapPin },
      { key: "delivered", label: "Delivered", icon: FiTruck },
      { key: "confirmed_by_buyer", label: "Completed", icon: FiCheckCircle },
    ]

    const currentStepIndex = steps.findIndex((step) => step.key === order?.deliveryStatus)

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      current: index === currentStepIndex,
    }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <Loader />
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
          <p className="text-gray-600 mt-2">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link to="/orders" className="text-primary hover:text-primary-600 mt-4 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const deliverySteps = getDeliveryStatusSteps()
  const isBuyer = order.buyerId === user?.id
  const canConfirmDelivery = isBuyer && order.deliveryStatus === "delivered" && !order.escrowReleased
  const canCancel =
    (isBuyer || order.sellerId === user?.id) &&
    !["completed", "cancelled"].includes(order.status) &&
    !order.escrowReleased

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/orders" className="flex items-center text-primary hover:text-primary-600 mb-4">
          <FiArrowLeft className="mr-2" />
          Back to Orders
        </Link>

        <PageHeader title={`Order #${order.orderNumber}`} subtitle={`Placed on ${formatDate(order.createdAt)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Status</h3>

            <div className="space-y-4">
              {deliverySteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.key} className="flex items-center">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : step.current
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="ml-4 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          step.completed || step.current ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>

                    {step.completed && <FiCheckCircle className="text-green-500" size={16} />}
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-3">
              {canConfirmDelivery && (
                <button
                  onClick={confirmDelivery}
                  disabled={confirmingDelivery}
                  className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {confirmingDelivery ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Confirming...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" />
                      Confirm Delivery
                    </>
                  )}
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
            </div>

            <div className="divide-y">
              {order.OrderItems?.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.Product?.Images?.[0]?.url || "/placeholder.svg?height=80&width=80"}
                      alt={item.Product?.title}
                      className="w-20 h-20 object-cover rounded-md"
                    />

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.Product?.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{item.Product?.category}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                        <span className="font-medium text-primary">₦{Number(item.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery Method</span>
                <span className="text-sm font-medium">
                  {order.deliveryMethod === "pickup" ? "Campus Pickup" : "Delivery"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Campus</span>
                <span className="text-sm font-medium">{order.campus}</span>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Seller Information</h3>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <FiUser className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{order.seller?.name}</p>
                <p className="text-sm text-gray-500">{order.seller?.campus}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm">₦{Number(order.subtotal).toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Platform Fee</span>
                <span className="text-sm">₦{Number(order.platformFee).toLocaleString()}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary">₦{Number(order.totalAmount).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-3">
                {order.escrowReleased ? (
                  <p className="text-green-600">✅ Payment released to seller</p>
                ) : (
                  <p>💰 Payment held in escrow until delivery confirmation</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Order</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Please provide a reason for cancelling this order..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelDialog(false)
                  setCancelReason("")
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                onClick={cancelOrder}
                disabled={cancelling || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetailPage
