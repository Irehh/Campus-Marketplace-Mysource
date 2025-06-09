import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPackage, FiEye, FiFilter, FiTruck } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { REACT_APP_API_URL } from "../config";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, statusFilter, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      // Direct Axios request with auth header
      const response = await axios.get(`${REACT_APP_API_URL}/api/orders/buyer?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Session expired. Please sign in again.");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "ready_for_pickup":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "confirmed_by_buyer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDeliveryStatus = (status) => {
    switch (status) {
      case "ready_for_pickup":
        return "Ready for Pickup";
      case "in_transit":
        return "In Transit";
      case "confirmed_by_buyer":
        return "Confirmed";
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A";
    }
  };

  const formatDate = (dateString) => {
    return dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={FiPackage}
          title="Sign in to view your orders"
          description="You need to be signed in to view your order history."
          actionText="Sign In"
          actionLink="/login"
        />
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="My Orders" subtitle="Track your purchases and delivery status" />
        <Link
          to="/seller-orders"
          className="flex items-center text-sm bg-purple-50 text-purple-700 px-3 py-2 rounded-md hover:bg-purple-100"
        >
          <FiTruck className="mr-2" size={16} />
          Seller Orders
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
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
          icon={FiPackage}
          title="No orders found"
          description={statusFilter ? `No orders with status "${statusFilter}"` : "You haven't placed any orders yet."}
          actionText="Browse Products"
          actionLink="/products"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">Order #{order.orderNumber || "N/A"}</h3>
                    <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                    <p className="text-sm text-gray-500">Seller: {order.seller?.name || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "N/A"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(
                          order.deliveryStatus
                        )}`}
                      >
                        {formatDeliveryStatus(order.deliveryStatus)}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary">₦{Number(order.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      {order.orderItems?.slice(0, 3).map((item, index) => (
                        <img
                          key={index}
                          src={item.Product?.Images?.[0]?.url || "/placeholder.png?height=40&width=40"}
                          alt={item.Product?.description || "Product"}
                          className="w-10 h-10 rounded-full border-2 border-white object-cover"
                        />
                      ))}
                      {order.orderItems?.length > 3 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          +{order.orderItems.length - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.deliveryMethod === "pickup" ? "Campus Pickup" : "Delivery"}
                      </p>
                    </div>
                  </div>
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
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {pagination.page || 1} of {pagination.totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;