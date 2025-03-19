"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import { FiSearch, FiUserPlus, FiUserX, FiTrash2, FiAlertTriangle } from "react-icons/fi"
import toast from "react-hot-toast"

const AdminUsers = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCampus, setSelectedCampus] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showMakeAdminModal, setShowMakeAdminModal] = useState(false)
  const [showRemoveUserModal, setShowRemoveUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [adminCampus, setAdminCampus] = useState("")

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
    // Redirect if not a super admin
    if (user && user.role !== "SUPER_ADMIN") {
      toast.error("You don't have permission to access this page")
      navigate("/admin/dashboard")
      return
    }

    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/admin/users", {
          params: {
            search,
            campus: selectedCampus,
            page,
            limit: 10,
          },
          headers: { Authorization: `Bearer ${token}` },
        })

        setUsers(response.data.users)
        setTotalPages(response.data.pagination.totalPages)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast.error("Failed to load users")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchUsers()
    }
  }, [token, user, navigate, search, selectedCampus, page])

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

  const openMakeAdminModal = (user) => {
    setSelectedUser(user)
    setAdminCampus(user.campus)
    setShowMakeAdminModal(true)
  }

  const openRemoveUserModal = (user) => {
    setSelectedUser(user)
    setShowRemoveUserModal(true)
  }

  const handleMakeAdmin = async () => {
    try {
      await axios.post(
        "/api/admin/admins",
        {
          userId: selectedUser.id,
          campus: adminCampus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      toast.success(`${selectedUser.name || selectedUser.email} is now an admin`)

      // Update user in the list
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, role: "ADMIN", campus: adminCampus } : u)))

      setShowMakeAdminModal(false)
    } catch (error) {
      console.error("Error making user admin:", error)
      toast.error("Failed to make user an admin")
    }
  }

  const handleRemoveAdmin = async (userId) => {
    try {
      await axios.delete(`/api/admin/admins/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success("Admin role has been removed")

      // Update user in the list
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: "USER" } : u)))
    } catch (error) {
      console.error("Error removing admin role:", error)
      toast.error("Failed to remove admin role")
    }
  }

  const handleRemoveUser = async () => {
    try {
      await axios.delete(`/api/admin/users/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success(`${selectedUser.name || selectedUser.email} has been removed from the platform`)

      // Remove user from the list
      setUsers(users.filter((u) => u.id !== selectedUser.id))

      setShowRemoveUserModal(false)
    } catch (error) {
      console.error("Error removing user:", error)
      toast.error("Failed to remove user")
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
        <h1 className="text-2xl font-bold">Manage Users</h1>
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
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary">
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
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Campus
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Listings
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name || "No Name"}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.campus || "Not set"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "ADMIN"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <span>{user._count.products} products</span>
                      <span>{user._count.businesses} businesses</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user.role === "USER" && (
                        <button
                          onClick={() => openMakeAdminModal(user)}
                          className="text-green-600 hover:text-green-900"
                          title="Make Admin"
                        >
                          <FiUserPlus size={18} />
                        </button>
                      )}

                      {user.role === "ADMIN" && (
                        <button
                          onClick={() => handleRemoveAdmin(user.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Remove Admin Role"
                        >
                          <FiUserX size={18} />
                        </button>
                      )}

                      {user.role !== "SUPER_ADMIN" && (
                        <button
                          onClick={() => openRemoveUserModal(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove User"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex justify-between items-center border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Make Admin Modal */}
      {showMakeAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Make User an Admin</h2>
            <p className="mb-4">
              You are about to make <span className="font-semibold">{selectedUser.name || selectedUser.email}</span> an
              admin. Admins can manage products and businesses on the platform.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Campus</label>
              <select
                value={adminCampus}
                onChange={(e) => setAdminCampus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {campusOptions
                  .filter((option) => option.value)
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMakeAdminModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeAdmin}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark"
              >
                Make Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove User Modal */}
      {showRemoveUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start mb-4">
              <FiAlertTriangle className="text-red-500 mr-3 mt-0.5 h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold text-red-700">Remove User</h2>
                <p className="text-gray-600 mt-1">
                  This action cannot be undone. This will permanently delete the user account and all associated data.
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-md mb-4">
              <p className="text-sm text-red-700">
                <span className="font-semibold">{selectedUser.name || selectedUser.email}</span> will be removed from
                the platform. All their products, businesses, and messages will also be deleted.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRemoveUserModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers

