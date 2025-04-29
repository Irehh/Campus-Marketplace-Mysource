// In src/pages/admin/AdminDashboard.jsx
;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { FiUsers, FiPackage, Fistor, FiAlertTriangle, FiBarChart2, FiChevronDown, FiChevronUp, FiActivity } from "react-icons/fi";
import toast from "react-hot-toast";
import { REACT_APP_API_URL, CAMPUSES } from "../../config";

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalBusinesses: 0,
    disabledProducts: 0,
    disabledBusinesses: 0,
    usersByCampus: {},
    productsByCategory: {},
    businessesByCategory: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState(user?.role === "SUPER_ADMIN" ? "" : user?.campus || "");
  const [showAnalytics, setShowAnalytics] = useState(false); // Toggle analytics

  const campusOptions = [{ value: "", label: "All Campuses" }, ...CAMPUSES];

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      toast.error("Access denied");
      navigate("/");
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${REACT_APP_API_URL}/api/admin/dashboard`, {
          params: { campus: selectedCampus },
          headers: { Authorization: `Bearer ${token}` },
        });
        setMetrics(response.data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchMetrics();
  }, [token, user, navigate, selectedCampus]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        {user?.role === "SUPER_ADMIN" && (
          <Link to="/admin/users" className="text-primary hover:underline text-sm">
            Manage Admins
          </Link>
        )}
      </div>

      {/* Campus Filter */}
      <div className="mb-4">
        <select
          value={selectedCampus}
          onChange={(e) => setSelectedCampus(e.target.value)}
          className="w-full md:w-48 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={user?.role === "ADMIN"}
        >
          {campusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiUsers className="text-primary mr-1" size={18} />
            <h3 className="text-sm font-medium">Users</h3>
          </div>
          <p className="text-lg font-bold">{metrics.totalUsers}</p>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiPackage className="text-primary mr-1" size={18} />
            <h3 className="text-sm font-medium">Products</h3>
          </div>
          <p className="text-lg font-bold">{metrics.totalProducts}</p>
          <Link to="/admin/products" className="text-primary text-xs hover:underline">
            Manage
          </Link>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiActivity className="text-primary mr-1" size={18} />
            <h3 className="text-sm font-medium">Businesses</h3>
          </div>
          <p className="text-lg font-bold">{metrics.totalBusinesses}</p>
          <Link to="/admin/businesses" className="text-primary text-xs hover:underline">
            Manage
          </Link>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-500 mr-1" size={18} />
            <h3 className="text-sm font-medium">Disabled</h3>
          </div>
          <p className="text-lg font-bold">{metrics.disabledProducts + metrics.disabledBusinesses}</p>
          <Link to="/admin/products?disabled=true" className="text-primary text-xs hover:underline">
            View
          </Link>
        </div>
      </div>

      {/* Analytics Toggle */}
      <button
        onClick={() => setShowAnalytics(!showAnalytics)}
        className="flex items-center text-sm font-medium text-primary hover:underline mb-2"
      >
        <FiBarChart2 className="mr-1" size={16} />
        Analytics {showAnalytics ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      {/* Analytics Section (Collapsible) */}
      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium flex items-center">
              <FiBarChart2 className="mr-1" size={16} /> Users by Campus
            </h3>
            <div className="mt-2 text-xs space-y-1">
              {Object.entries(metrics.usersByCampus).length ? (
                Object.entries(metrics.usersByCampus).map(([campus, count]) => (
                  <div key={campus} className="flex justify-between">
                    <span>{CAMPUSES.find((c) => c.value === campus)?.label || campus}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No data</p>
              )}
            </div>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium flex items-center">
              <FiullieBarChart2 className="mr-1" size={16} /> Products by Category
            </h3>
            <div className="mt-2 text-xs space-y-1">
              {Object.entries(metrics.productsByCategory).length ? (
                Object.entries(metrics.productsByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No data</p>
              )}
            </div>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium flex items-center">
              <FiBarChart2 className="mr-1" size={16} /> Businesses by Category
            </h3>
            <div className="mt-2 text-xs space-y-1">
              {Object.entries(metrics.businessesByCategory).length ? (
                Object.entries(metrics.businessesByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No data</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;