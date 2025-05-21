// "use client"

// import { useState, useEffect } from "react"
// import { Link } from "react-router-dom"
// import { FiEdit, FiTrash, FiPlus, FiBell, FiSettings } from "react-icons/fi"
// import { useAuth } from "../contexts/AuthContext"
// import axios from "axios"
// import toast from "react-hot-toast"

// const UserDashboardPage = () => {
//   const { user, token } = useAuth()
//   const [loading, setLoading] = useState(true)
//   const [products, setProducts] = useState([])
//   const [businesses, setBusinesses] = useState([])
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false)
//   const [itemToDelete, setItemToDelete] = useState(null)
//   const [deleteType, setDeleteType] = useState("")
//   const [gigs, setGigs] = useState([])

//   // Use your existing API base URL
//   const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

//   useEffect(() => {
//     const fetchUserListings = async () => {
//       try {
//         setLoading(true)

//         // Fetch user's products
//         const productsResponse = await axios.get(`${REACT_APP_API_URL}/products/user`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         // Check if the response has the expected structure
//         if (productsResponse.data && productsResponse.data.products) {
//           setProducts(productsResponse.data.products)
//         } else if (Array.isArray(productsResponse.data)) {
//           // Handle case where the API returns an array directly
//           setProducts(productsResponse.data)
//         } else {
//           console.error("Unexpected products response format:", productsResponse.data)
//           setProducts([])
//         }

//         // Fetch user's businesses
//         const businessesResponse = await axios.get(`${REACT_APP_API_URL}/businesses/user`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         // Check if the response has the expected structure
//         if (businessesResponse.data && businessesResponse.data.businesses) {
//           setBusinesses(businessesResponse.data.businesses)
//         } else if (Array.isArray(businessesResponse.data)) {
//           // Handle case where the API returns an array directly
//           setBusinesses(businessesResponse.data)
//         } else {
//           console.error("Unexpected businesses response format:", businessesResponse.data)
//           setBusinesses([])
//         }

//         // Fetch user's gigs
//         try {
//           const gigsResponse = await axios.get(`${REACT_APP_API_URL}/gigs/my/client`, {
//             headers: { Authorization: `Bearer ${token}` },
//           })

//           if (gigsResponse.data && gigsResponse.data.data) {
//             setGigs(gigsResponse.data.data)
//           } else if (Array.isArray(gigsResponse.data)) {
//             setGigs(gigsResponse.data)
//           } else {
//             console.error("Unexpected gigs response format:", gigsResponse.data)
//             setGigs([])
//           }
//         } catch (error) {
//           console.error("Error fetching user gigs:", error)
//           setGigs([])
//         }
//       } catch (error) {
//         console.error("Error fetching user listings:", error)
//         toast.error("Failed to load your listings")
//       } finally {
//         setLoading(false)
//       }
//     }

//     if (user && token) {
//       fetchUserListings()
//     }
//   }, [user, token, REACT_APP_API_URL])

//   const handleDeleteClick = (item, type) => {
//     setItemToDelete(item)
//     setDeleteType(type)
//     setShowDeleteDialog(true)
//   }

//   const handleDeleteConfirm = async () => {
//     try {
//       if (deleteType === "product") {
//         await axios.delete(`${REACT_APP_API_URL}/products/${itemToDelete.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//         setProducts(products.filter((p) => p.id !== itemToDelete.id))
//         toast.success("Product deleted successfully")
//       } else if (deleteType === "business") {
//         await axios.delete(`${REACT_APP_API_URL}/businesses/${itemToDelete.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//         setBusinesses(businesses.filter((b) => b.id !== itemToDelete.id))
//         toast.success("Business deleted successfully")
//       } else if (deleteType === "gig") {
//         await axios.delete(`${REACT_APP_API_URL}/gigs/${itemToDelete.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//         setGigs(gigs.filter((g) => g.id !== itemToDelete.id))
//         toast.success("Gig deleted successfully")
//       }
//     } catch (error) {
//       console.error("Error deleting item:", error)
//       toast.error("Failed to delete item")
//     } finally {
//       setShowDeleteDialog(false)
//       setItemToDelete(null)
//     }
//   }

//   const renderListingCard = (item, type) => {
//     const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : "/placeholder.svg"
//     const editUrl =
//       type === "product"
//         ? `/edit-product/${item.id}`
//         : type === "business"
//           ? `/edit-business/${item.id}`
//           : `/gigs/${item.id}/edit`
//     const detailUrl =
//       type === "product" ? `/products/${item.id}` : type === "business" ? `/businesses/${item.id}` : `/gigs/${item.id}`
//     const isDisabled = item.isDisabled === true

//     return (
//       <div key={item.id} className={`bg-white rounded-lg shadow-sm overflow-hidden ${isDisabled ? "opacity-60" : ""}`}>
//         <div className="relative h-32">
//           <img
//             src={imageUrl || "/placeholder.svg"}
//             alt={item.name || item.description}
//             className="w-full h-full object-cover"
//           />
//           {isDisabled && (
//             <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Disabled</div>
//           )}
//         </div>
//         <div className="p-3">
//           <h3 className="text-md font-semibold truncate">{item.name || item.description}</h3>
//           <p className="text-gray-600 text-xs mb-1 truncate">{item.category || "Uncategorized"}</p>

//           {type === "product" && item.price && (
//             <p className="text-primary font-bold mb-2 text-sm">₦{item.price.toLocaleString()}</p>
//           )}

//           {type === "gig" && item.budget && (
//             <p className="text-primary font-bold mb-2 text-sm">₦{item.budget.toLocaleString()}</p>
//           )}

//           <div className="flex justify-between items-center">
//             <Link to={detailUrl} className="text-blue-600 hover:text-blue-800 text-xs">
//               View
//             </Link>
//             <div className="flex space-x-1">
//               <Link to={editUrl} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Edit">
//                 <FiEdit size={14} />
//               </Link>
//               <button
//                 onClick={() => handleDeleteClick(item, type)}
//                 className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
//                 title="Delete"
//               >
//                 <FiTrash size={14} />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="container mx-auto px-3 py-4">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-xl font-bold">My Dashboard</h1>
//         <div className="flex space-x-2">
//           <Link
//             to="/notification-settings"
//             className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100"
//           >
//             <FiBell className="mr-1" size={14} />
//             Notification Settings
//           </Link>
//           <Link
//             to="/profile"
//             className="flex items-center text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200"
//           >
//             <FiSettings className="mr-1" size={14} />
//             Profile Settings
//           </Link>
//         </div>
//       </div>

//       {/* Products Section */}
//       <section className="mb-6">
//         <div className="flex justify-between items-center mb-3">
//           <h2 className="text-lg font-medium">My Products</h2>
//           <Link
//             to="/add-listing"
//             className="bg-primary text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-primary-dark"
//           >
//             <FiPlus className="mr-1" size={12} /> Add
//           </Link>
//         </div>

//         {products.length === 0 ? (
//           <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
//             You haven't listed any products yet
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//             {products.map((product) => renderListingCard(product, "product"))}
//           </div>
//         )}
//       </section>

//       {/* Businesses Section */}
//       <section className="mb-6">
//         <div className="flex justify-between items-center mb-3">
//           <h2 className="text-lg font-medium">My Businesses</h2>
//           <Link
//             to="/add-listing"
//             className="bg-primary text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-primary-dark"
//           >
//             <FiPlus className="mr-1" size={12} /> Add
//           </Link>
//         </div>

//         {businesses.length === 0 ? (
//           <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
//             You haven't listed any businesses yet
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//             {businesses.map((business) => renderListingCard(business, "business"))}
//           </div>
//         )}
//       </section>

//       {/* Gigs Section */}
//       <section className="mb-6">
//         <div className="flex justify-between items-center mb-3">
//           <h2 className="text-lg font-medium">My Gigs</h2>
//           <Link
//             to="/gigs/create"
//             className="bg-primary text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-primary-dark"
//           >
//             <FiPlus className="mr-1" size={12} /> Add
//           </Link>
//         </div>

//         {gigs.length === 0 ? (
//           <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
//             You haven't posted any gigs yet
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//             {gigs.map((gig) => renderListingCard(gig, "gig"))}
//           </div>
//         )}
//       </section>

//       {/* Delete Confirmation Dialog */}
//       {showDeleteDialog && (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-4 max-w-xs w-full">
//             <h3 className="text-md font-bold mb-2">Delete {deleteType === "product" ? "Product" : "Business"}</h3>
//             <p className="text-gray-600 text-sm mb-4">
//               Are you sure you want to delete "{itemToDelete?.name || itemToDelete?.description}"?
//             </p>
//             <div className="flex justify-end space-x-2">
//               <button
//                 onClick={() => setShowDeleteDialog(false)}
//                 className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDeleteConfirm}
//                 className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default UserDashboardPage

"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  FiEdit,
  FiTrash,
  FiPlus,
  FiBell,
  FiSettings,
  FiDollarSign,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownLeft,
} from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import toast from "react-hot-toast"

const UserDashboardPage = () => {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [gigs, setGigs] = useState([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState("")
  const [walletSummary, setWalletSummary] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])

  // Use your existing API base URL
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        setLoading(true)

        // Fetch user's products
        const productsResponse = await axios.get(`${REACT_APP_API_URL}/products/user`, {
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
        const businessesResponse = await axios.get(`${REACT_APP_API_URL}/businesses/user`, {
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

        // Fetch user's gigs
        try {
          const gigsResponse = await axios.get(`${REACT_APP_API_URL}/gigs/my/client`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (gigsResponse.data && gigsResponse.data.data) {
            setGigs(gigsResponse.data.data)
          } else if (Array.isArray(gigsResponse.data)) {
            setGigs(gigsResponse.data)
          } else {
            console.error("Unexpected gigs response format:", gigsResponse.data)
            setGigs([])
          }
        } catch (error) {
          console.error("Error fetching user gigs:", error)
          setGigs([])
        }

        // Fetch wallet summary
        try {
          const walletResponse = await axios.get(`${REACT_APP_API_URL}/wallet/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          setWalletSummary(walletResponse.data)
          if (walletResponse.data.recentTransactions) {
            setRecentTransactions(walletResponse.data.recentTransactions)
          }
        } catch (error) {
          console.error("Error fetching wallet summary:", error)
          // Don't show error toast for wallet if it's not set up yet
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
  }, [user, token, REACT_APP_API_URL])

  const handleDeleteClick = (item, type) => {
    setItemToDelete(item)
    setDeleteType(type)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === "product") {
        await axios.delete(`${REACT_APP_API_URL}/products/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProducts(products.filter((p) => p.id !== itemToDelete.id))
        toast.success("Product deleted successfully")
      } else if (deleteType === "business") {
        await axios.delete(`${REACT_APP_API_URL}/businesses/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBusinesses(businesses.filter((b) => b.id !== itemToDelete.id))
        toast.success("Business deleted successfully")
      } else if (deleteType === "gig") {
        await axios.delete(`${REACT_APP_API_URL}/gigs/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setGigs(gigs.filter((g) => g.id !== itemToDelete.id))
        toast.success("Gig deleted successfully")
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
    const editUrl =
      type === "product"
        ? `/edit-product/${item.id}`
        : type === "business"
          ? `/edit-business/${item.id}`
          : `/gigs/${item.id}/edit`
    const detailUrl =
      type === "product" ? `/products/${item.id}` : type === "business" ? `/businesses/${item.id}` : `/gigs/${item.id}`
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

          {type === "gig" && item.budget && (
            <p className="text-primary font-bold mb-2 text-sm">₦{item.budget.toLocaleString()}</p>
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <FiArrowDownLeft className="text-green-500" />
      case "withdrawal":
        return <FiArrowUpRight className="text-red-500" />
      case "escrow":
        return <FiDollarSign className="text-blue-500" />
      case "release":
        return <FiArrowDownLeft className="text-green-500" />
      case "refund":
        return <FiArrowUpRight className="text-orange-500" />
      case "fee":
      case "withdrawal_fee":
        return <FiDollarSign className="text-gray-500" />
      default:
        return <FiDollarSign className="text-gray-500" />
    }
  }

  const getTransactionStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "escrow":
        return "Escrow"
      case "release":
        return "Payment"
      case "refund":
        return "Refund"
      case "fee":
        return "Fee"
      case "withdrawal_fee":
        return "Withdrawal Fee"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
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

      {/* Wallet Summary Section */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">My Wallet</h2>
          <div className="flex space-x-2">
            <Link
              to="/wallet/deposit"
              className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-green-700"
            >
              <FiArrowDownLeft className="mr-1" size={12} /> Deposit
            </Link>
            <Link
              to="/wallet/withdraw"
              className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-blue-700"
            >
              <FiArrowUpRight className="mr-1" size={12} /> Withdraw
            </Link>
            <Link
              to="/wallet"
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md flex items-center text-sm hover:bg-gray-200"
            >
              <FiCreditCard className="mr-1" size={12} /> Wallet
            </Link>
          </div>
        </div>

        {walletSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Available Balance</p>
              <h3 className="text-2xl font-bold text-primary">
                ₦{walletSummary.wallet?.balance?.toLocaleString() || "0"}
              </h3>
              <div className="mt-2">
                <Link to="/wallet" className="text-blue-600 text-xs hover:underline">
                  View Details
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Pending Balance</p>
              <h3 className="text-2xl font-bold text-yellow-600">
                ₦{walletSummary.wallet?.pendingBalance?.toLocaleString() || "0"}
              </h3>
              <div className="mt-2">
                <p className="text-xs text-gray-500">Funds in escrow or processing</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Monthly Earnings</p>
              <h3 className="text-2xl font-bold text-green-600">
                ₦{walletSummary.monthlyEarnings?.toLocaleString() || "0"}
              </h3>
              <div className="mt-2">
                <Link to="/transactions" className="text-blue-600 text-xs hover:underline">
                  View Transactions
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Set Up Your Wallet</h3>
            <p className="text-gray-600 mb-4">Start managing your finances on Campus Marketplace</p>
            <Link
              to="/wallet"
              className="bg-primary text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-primary-dark"
            >
              <FiCreditCard className="mr-2" /> Set Up Wallet
            </Link>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions && recentTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium">Recent Transactions</h3>
              <Link to="/transactions" className="text-blue-600 text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.slice(0, 3).map((transaction) => (
                    <tr key={transaction.id} className="border-b last:border-0">
                      <td className="py-3 flex items-center">
                        <span className="mr-2">{getTransactionIcon(transaction.type)}</span>
                        {getTransactionTypeLabel(transaction.type)}
                      </td>
                      <td className="py-3 font-medium">₦{transaction.amount.toLocaleString()}</td>
                      <td className="py-3 text-gray-500">{formatDate(transaction.createdAt)}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getTransactionStatusClass(transaction.status)}`}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

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

      {/* Gigs Section */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">My Gigs</h2>
          <div className="flex space-x-2">
            <Link
              to="/gigs/create"
              className="bg-primary text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-primary-dark"
            >
              <FiPlus className="mr-1" size={12} /> Add
            </Link>
            <Link
              to="/my-bids"
              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md flex items-center text-sm hover:bg-blue-100"
            >
              My Bids
            </Link>
          </div>
        </div>

        {gigs.length === 0 ? (
          <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
            You haven't posted any gigs yet
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gigs.map((gig) => renderListingCard(gig, "gig"))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-xs w-full">
            <h3 className="text-md font-bold mb-2">
              Delete {deleteType === "product" ? "Product" : deleteType === "business" ? "Business" : "Gig"}
            </h3>
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

