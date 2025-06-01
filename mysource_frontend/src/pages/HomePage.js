// "use client"

// import { useState, useEffect, useCallback } from "react"
// import { Link } from "react-router-dom"
// import axios from "axios"
// import Cookies from "js-cookie"
// import ProductCard from "../components/ProductCard"
// import BusinessCard from "../components/BusinessCard"
// import { FiSearch, FiShoppingBag, FiGrid } from "react-icons/fi"
// import { BsTelegram } from "react-icons/bs"
// import { useAuth } from "../contexts/AuthContext"
// import { useCacheUpdateListener } from "../utils/cacheUpdateListener"
// import { FiDollarSign, FiUsers, FiEye } from "react-icons/fi"
// import { formatCurrency } from "../utils/format"

// const HomePage = () => {
//   const { isAuthenticated, user } = useAuth()
//   const [products, setProducts] = useState([])
//   const [businesses, setBusinesses] = useState([])
//   const [gigs, setGigs] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [userCampus, setUserCampus] = useState("")
//   const [refreshing, setRefreshing] = useState(false)

//   // Mapping of campus codes to telegram channels
//   const campusChannels = {
//     unilag: "unilag_marketplace",
//     uniben: "uniben_marketplace",
//     ui: "ui_marketplace",
//     oau: "oau_marketplace",
//     uniport: "uniport_marketplace",
//   }

//   const fetchData = useCallback(async () => {
//     try {
//       setRefreshing(true)
//       // Get campus from user if authenticated, otherwise from cookie
//       const campus = isAuthenticated ? user.campus : Cookies.get("userCampus") || ""
//       setUserCampus(campus)

//       // Fetch products, businesses, and gigs in parallel
//       const [productsRes, businessesRes, gigsRes] = await Promise.all([
//         axios.get(`/api/products?campus=${campus}&limit=4`),
//         axios.get(`/api/businesses?campus=${campus}&limit=3`),
//         axios.get(`/api/gigs?campus=${campus}&limit=4`),
//       ])

//       setProducts(productsRes.data.products)
//       setBusinesses(businessesRes.data.businesses)
//       setGigs(gigsRes.data.data || [])
//     } catch (error) {
//       console.error("Error fetching data:", error)
//     } finally {
//       setLoading(false)
//       setRefreshing(false)
//     }
//   }, [isAuthenticated, user])

//   useEffect(() => {
//     fetchData()
//   }, [fetchData])

//   // Listen for cache updates
//   useCacheUpdateListener("homepage-products", () => {
//     console.log("Products updated in cache, refreshing...")
//     fetchData()
//   })

//   useCacheUpdateListener("homepage-businesses", () => {
//     console.log("Businesses updated in cache, refreshing...")
//     fetchData()
//   })

//   useCacheUpdateListener("homepage-gigs", () => {
//     console.log("Gigs updated in cache, refreshing...")
//     fetchData()
//   })

//   const handleSearch = (e) => {
//     e.preventDefault()
//     if (searchQuery.trim()) {
//       window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
//     }
//   }

//   const joinTelegramChannel = () => {
//     const channel = userCampus ? campusChannels[userCampus] : "campus_marketplace_general"
//     window.open(`https://t.me/${channel}`, "_blank")
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-4">
//       {/* Hero Section */}
//       <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-lg p-4 text-center">
//         <h1 className="text-2xl md:text-3xl font-bold mb-2">Campus Marketplace</h1>
//         <p className="text-sm mb-4 max-w-2xl mx-auto">
//           Find products and businesses on your campus. Buy, sell, and discover local services.
//         </p>

//         <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
//           <input
//             type="text"
//             placeholder="Search products or businesses..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
//           />
//           <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
//           <button
//             type="submit"
//             className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-primary-700 rounded-full p-1"
//           >
//             <FiSearch size={18} />
//           </button>
//         </form>
//       </section>

//       {/* Telegram Promotion */}
//       <section className="bg-blue-500 text-white rounded-lg p-3 relative overflow-hidden">
//         <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-20">
//           <BsTelegram size={80} />
//         </div>
//         <div className="relative z-10">
//           <div className="flex items-center">
//             <BsTelegram size={24} className="mr-2" />
//             <h2 className="text-lg font-bold">Join our Telegram Community!</h2>
//           </div>
//           <p className="text-sm mt-1 mb-2">
//             Get instant updates, exclusive deals, and connect with other students on your campus.
//           </p>
//           <div className="flex space-x-2">
//             <button
//               onClick={joinTelegramChannel}
//               className="bg-white text-blue-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-50"
//             >
//               Join Now
//             </button>
//             <Link to="/telegram-info" className="text-white/80 text-sm underline hover:text-white">
//               Learn More
//             </Link>
//             <Link to="/telegram-setup" className="text-white/80 text-sm underline hover:text-white">
//               Setup Guide
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Featured Products */}
//       <section>
//         <div className="flex justify-between items-center mb-2">
//           <h2 className="text-lg font-bold flex items-center">
//             <FiShoppingBag className="mr-2" /> Featured Products
//           </h2>
//           <div className="flex items-center gap-2">
//             {refreshing && (
//               <span className="text-xs text-secondary-500 flex items-center">
//                 <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full mr-1"></div>
//                 Updating...
//               </span>
//             )}
//             <Link to="/products" className="text-primary hover:underline text-xs">
//               View all
//             </Link>
//           </div>
//         </div>

//         {products.length > 0 ? (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//             {products.map((product) => (
//               <ProductCard key={product.id} product={product} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-6 bg-secondary-50 rounded-lg">
//             <p className="text-secondary-600 text-sm">No products found.</p>
//             <Link to="/add-listing" className="text-primary hover:underline mt-1 inline-block text-xs">
//               Be the first to add a product!
//             </Link>
//           </div>
//         )}
//       </section>

//       {/* Featured Businesses */}
//       <section>
//         <div className="flex justify-between items-center mb-2">
//           <h2 className="text-lg font-bold flex items-center">
//             <FiGrid className="mr-2" /> Campus Businesses
//           </h2>
//           <div className="flex items-center gap-2">
//             {refreshing && (
//               <span className="text-xs text-secondary-500 flex items-center">
//                 <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full mr-1"></div>
//                 Updating...
//               </span>
//             )}
//             <Link to="/businesses" className="text-primary hover:underline text-xs">
//               View all
//             </Link>
//           </div>
//         </div>

//         {businesses.length > 0 ? (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//             {businesses.map((business) => (
//               <BusinessCard key={business.id} business={business} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-6 bg-secondary-50 rounded-lg">
//             <p className="text-secondary-600 text-sm">No businesses found.</p>
//             <Link to="/add-listing" className="text-primary hover:underline mt-1 inline-block text-xs">
//               Be the first to add a business!
//             </Link>
//           </div>
//         )}
//       </section>

//       {/* Featured Gigs */}
//       <section>
//         <div className="flex justify-between items-center mb-2">
//           <h2 className="text-lg font-bold flex items-center">
//             <FiDollarSign className="mr-2" /> Campus Gigs
//           </h2>
//           <div className="flex items-center gap-2">
//             {refreshing && (
//               <span className="text-xs text-secondary-500 flex items-center">
//                 <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full mr-1"></div>
//                 Updating...
//               </span>
//             )}
//             <Link to="/gigs" className="text-primary hover:underline text-xs">
//               View all
//             </Link>
//           </div>
//         </div>

//         {gigs && gigs.length > 0 ? (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//             {gigs.map((gig) => (
//               <Link
//                 key={gig.id}
//                 to={`/gigs/${gig.id}`}
//                 className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
//               >
//                 <div className="p-3">
//                   <h3 className="text-sm font-medium text-gray-900 truncate">
//                     {gig.description ? gig.description.substring(0, 50) + "..." : "Gig"}
//                   </h3>
//                   <p className="text-sm font-medium text-primary mt-1">{formatCurrency(gig.budget)}</p>
//                   <div className="flex justify-between items-center mt-2">
//                     <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
//                       {gig.category}
//                     </span>
//                     <div className="flex items-center space-x-2">
//                       <span className="text-xs text-gray-500 flex items-center">
//                         <FiEye className="mr-1" size={10} />
//                         {gig.views || 0}
//                       </span>
//                       <span className="text-xs text-gray-500 flex items-center">
//                         <FiUsers className="mr-1" size={10} />
//                         {gig.bidCount || 0}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-6 bg-secondary-50 rounded-lg">
//             <p className="text-secondary-600 text-sm">No gigs found.</p>
//             <Link to="/gigs/create" className="text-primary hover:underline mt-1 inline-block text-xs">
//               Be the first to post a gig!
//             </Link>
//           </div>
//         )}
//       </section>

//       {/* Call to Action */}
//       <section className="bg-secondary-100 rounded-lg p-4 text-center">
//         <h2 className="text-lg font-bold mb-1">Have something to sell?</h2>
//         <p className="mb-3 text-secondary-600 text-sm">
//           List your products or business on Campus Marketplace and reach students on your campus.
//         </p>
//         <Link to="/add-listing" className="btn btn-primary inline-block text-sm py-1.5">
//           Add Listing
//         </Link>
//       </section>
//     </div>
//   )
// }

// export default HomePage


"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Cookies from "js-cookie"
import ProductCard from "../components/ProductCard"
import BusinessCard from "../components/BusinessCard"
import { FiSearch, FiShoppingBag, FiGrid, FiDollarSign, FiUsers, FiEye, FiShield, FiTrendingUp, FiMessageCircle, FiArrowRight } from "react-icons/fi"
import { BsTelegram } from "react-icons/bs"
import { FaWhatsapp } from "react-icons/fa"
import { useAuth } from "../contexts/AuthContext"
import { useCacheUpdateListener } from "../utils/cacheUpdateListener"
import { formatCurrency } from "../utils/format"
import { SOCIAL_MEDIA_LINKS, CAMPUSES } from "../config"

const HomePage = () => {
  const { isAuthenticated, user } = useAuth()
  const [products, setProducts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userCampus, setUserCampus] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      const campus = isAuthenticated ? user.campus : Cookies.get("userCampus") || ""
      setUserCampus(campus)

      const [productsRes, businessesRes, gigsRes] = await Promise.all([
        axios.get(`/api/products?campus=${campus}&limit=4`),
        axios.get(`/api/businesses?campus=${campus}&limit=3`),
        axios.get(`/api/gigs?campus=${campus}&limit=4`),
      ])

      setProducts(productsRes.data.products)
      setBusinesses(businessesRes.data.businesses)
      setGigs(gigsRes.data.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useCacheUpdateListener("homepage-products", () => {
    console.log("Products updated in cache, refreshing...")
    fetchData()
  })

  useCacheUpdateListener("homepage-businesses", () => {
    console.log("Businesses updated in cache, refreshing...")
    fetchData()
  })

  useCacheUpdateListener("homepage-gigs", () => {
    console.log("Gigs updated in cache, refreshing...")
    fetchData()
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const campus = userCampus || ""
  const socialLinks = SOCIAL_MEDIA_LINKS[campus] || SOCIAL_MEDIA_LINKS.default

  // Get campus label from CAMPUSES config
  const campusLabel = campus
    ? CAMPUSES.find(c => c.value === campus)?.label || campus.toUpperCase()
    : "Campus"

  const marketplaceName = campus ? `${campusLabel} Marketplace` : "Campus Marketplace"
  const communityName = campus ? `${campusLabel} Communities` : "Campus Communities"
  const connectText = campus ? `Connect with ${campusLabel} students` : "Connect with campus students"
  const ctaText = campus
    ? `Join ${campusLabel} students buying, selling, and connecting on ${marketplaceName}`
    : "Join students buying, selling, and connecting on Campus Marketplace"

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-lg p-4 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{marketplaceName}</h1>
        <p className="text-sm mb-4 max-w-2xl mx-auto">
          Find products, services, and gigs on your campus. {connectText}.
        </p>
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search products, services, or gigs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-primary-700 rounded-full p-1"
          >
            <FiSearch size={18} />
          </button>
        </form>
      </section>

      {/* Features Section */}
      {/* <section className="relative">
        <div className="relative bg-gray-100 rounded-lg p-4 mb-4 overflow-hidden">
          <img
            src="we.gif" // Replace with your funny campus GIF
            alt="Funny campus GIF"
            className="w-full h-32 object-cover opacity-70"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md">
            <span className="text-sm font-semibold animate-text-swap"></span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiShoppingBag className="text-blue-500" size={20} />
            </div>
            <h3 className="text-base font-semibold mb-1">Buy & Sell Products</h3>
            <p className="text-gray-600 text-xs">
              Find textbooks, electronics, and more at great prices.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiGrid className="text-green-500" size={20} />
            </div>
            <h3 className="text-base font-semibold mb-1">Campus Services</h3>
            <p className="text-gray-600 text-xs">
              Discover local businesses, from food to tutoring.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiDollarSign className="text-purple-500" size={20} />
            </div>
            <h3 className="text-base font-semibold mb-1">Freelance Gigs</h3>
            <p className="text-gray-600 text-xs">
              Offer or hire skills for projects and tasks.
            </p>
          </div>
        </div>
      </section> */}

      {/* Community Section */}
      <section className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-20">
          <BsTelegram size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center">
            <BsTelegram size={24} className="mr-2" />
            <FaWhatsapp size={24} className="mr-2" />
            <h2 className="text-lg font-bold">Join Our {communityName}!</h2>
          </div>
          <p className="text-sm mt-1 mb-2">
            Connect on Telegram and WhatsApp for updates, deals, and campus vibes.
          </p>
          <div className="flex space-x-2">
            <a
              href={socialLinks.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-50"
            >
              Join Telegram
            </a>
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-green-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-green-50"
            >
              Join WhatsApp
            </a>
            <Link to="/community-info" className="text-white/80 text-sm underline hover:text-white">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-secondary-100 rounded-lg p-4">
        <h2 className="text-lg font-bold text-center mb-4">How It Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-700 font-bold">1</span>
            </div>
            <h4 className="text-sm font-semibold mb-1">Sign Up</h4>
            <p className="text-xs text-gray-600">Join with your campus email.</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-700 font-bold">2</span>
            </div>
            <h4 className="text-sm font-semibold mb-1">Browse or List</h4>
            <p className="text-xs text-gray-600">Find or list items/services.</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-700 font-bold">3</span>
            </div>
            <h4 className="text-sm font-semibold mb-1">Connect</h4>
            <p className="text-xs text-gray-600">Message sellers or buyers.</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-700 font-bold">4</span>
            </div>
            <h4 className="text-sm font-semibold mb-1">Complete</h4>
            <p className="text-xs text-gray-600">Meet safely to transact.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiShoppingBag className="mr-2" /> Featured Products
          </h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-secondary-500 flex items-center">
                <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary-700 rounded-full mr-1"></div>
                Updating...
              </span>
            )}
            <Link to="/products" className="text-primary-700 hover:underline text-xs">
              View all
            </Link>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No products found.</p>
            <Link to="/add-listing" className="text-primary-700 hover:underline mt-1 inline-block text-xs">
              Be the first to add a product!
            </Link>
          </div>
        )}
      </section>

      {/* Featured Businesses */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiGrid className="mr-2" /> Campus Businesses
          </h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-secondary-500 flex items-center">
                <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary-700 rounded-full mr-1"></div>
                Updating...
              </span>
            )}
            <Link to="/businesses" className="text-primary-700 hover:underline text-xs">
              View all
            </Link>
          </div>
        </div>
        {businesses.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No businesses found.</p>
            <Link to="/add-listing" className="text-primary-700 hover:underline mt-1 inline-block text-xs">
              Be the first to add a business!
            </Link>
          </div>
        )}
      </section>

      {/* Featured Gigs */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiDollarSign className="mr-2" /> Campus Gigs
          </h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-secondary-500 flex items-center">
                <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary-700 rounded-full mr-1"></div>
                Updating...
              </span>
            )}
            <Link to="/gigs" className="text-primary-700 hover:underline text-xs">
              View all
            </Link>
          </div>
        </div>
        {gigs && gigs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {gigs.map((gig) => (
              <Link
                key={gig.id}
                to={`/gigs/${gig.id}`}
                className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {gig.description ? gig.description.substring(0, 50) + "..." : "Gig"}
                  </h3>
                  <p className="text-sm font-medium text-primary-700 mt-1">{formatCurrency(gig.budget)}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      {gig.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 flex items-center">
                        <FiEye className="mr-1" size={10} />
                        {gig.views || 0}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <FiUsers className="mr-1" size={10} />
                        {gig.bidCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No gigs found.</p>
            <Link to="/gigs/create" className="text-primary-700 hover:underline mt-1 inline-block text-xs">
              Be the first to post a gig!
            </Link>
          </div>
        )}
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-center mb-4">Why Choose {marketplaceName}?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <FiShield className="mx-auto text-green-500 mb-2" size={20} />
            <h4 className="text-sm font-semibold mb-1">Safe & Secure</h4>
            <p className="text-xs text-gray-600">Verified users and secure messaging.</p>
          </div>
          <div className="text-center">
            <FiUsers className="mx-auto text-blue-500 mb-2" size={20} />
            <h4 className="text-sm font-semibold mb-1">{campus ? `${campusLabel} Community` : "Campus Community"}</h4>
            <p className="text-xs text-gray-600">{connectText}.</p>
          </div>
          <div className="text-center">
            <FiTrendingUp className="mx-auto text-yellow-500 mb-2" size={20} />
            <h4 className="text-sm font-semibold mb-1">Best Prices</h4>
            <p className="text-xs text-gray-600">Student-friendly deals.</p>
          </div>
          <div className="text-center">
            <FiMessageCircle className="mx-auto text-orange-500 mb-2" size={20} />
            <h4 className="text-sm font-semibold mb-1">Easy Communication</h4>
            <p className="text-xs text-gray-600">Built-in messaging system.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary-700 text-white rounded-lg p-4 text-center">
        <h2 className="text-lg font-bold mb-1">Ready to Get Started?</h2>
        <p className="mb-3 text-gray-300 text-sm">{ctaText}</p>
        <Link to="/add-listing" className="inline-block bg-white text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-100">
          Start Selling
        </Link>
      </section>
    </div>
  )
}

export default HomePage