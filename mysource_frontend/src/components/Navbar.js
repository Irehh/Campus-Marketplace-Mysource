// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Link, useNavigate } from "react-router-dom"
// import { useAuth } from "../contexts/AuthContext"
// import { FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiPlus, FiMessageCircle, FiHeart } from "react-icons/fi"
// import CampusSelector from "./CampusSelector"
// import axios from "axios"
// import { useFavorites } from "../contexts/FavoritesContext"

// const Navbar = () => {
//   const { user, isAuthenticated, logout, token } = useAuth()
//   const { favorites } = useFavorites()
//   const [isMenuOpen, setIsMenuOpen] = useState(false)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [dropdownOpen, setDropdownOpen] = useState(false)
//   const [unreadCount, setUnreadCount] = useState(0)
//   const navigate = useNavigate()
//   const dropdownRef = useRef(null)
//   const timeoutRef = useRef(null)

//   // Fetch unread messages count
//   useEffect(() => {
//     if (isAuthenticated && token) {
//       const fetchUnreadCount = async () => {
//         try {
//           const response = await axios.get("/api/messages/unread-count", {
//             headers: { Authorization: `Bearer ${token}` },
//           })
//           setUnreadCount(response.data.count)
//         } catch (error) {
//           console.error("Error fetching unread messages count:", error)
//         }
//       }

//       fetchUnreadCount()

//       // Poll for new messages every 30 seconds
//       const interval = setInterval(fetchUnreadCount, 30000)

//       return () => clearInterval(interval)
//     }
//   }, [isAuthenticated, token])

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen)
//   }

//   const handleSearch = (e) => {
//     e.preventDefault()
//     if (searchQuery.trim()) {
//       navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
//       setSearchQuery("")
//       setIsMenuOpen(false)
//     }
//   }

//   const handleLogout = () => {
//     try {
//       logout()
//       navigate("/")
//       setIsMenuOpen(false)
//       setDropdownOpen(false)
//     } catch (error) {
//       console.error("Logout error:", error)
//     }
//   }

//   const handleDropdownOpen = () => {
//     setDropdownOpen(true)
//     // Clear any existing timeout
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current)
//     }
//   }

//   const handleDropdownClose = () => {
//     // Set a timeout to close the dropdown after 4 seconds
//     timeoutRef.current = setTimeout(() => {
//       setDropdownOpen(false)
//     }, 4000) // 4 seconds
//   }

//   // Clean up timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current)
//       }
//     }
//   }, [])

//   return (
//     <nav className="bg-white shadow-sm overflow-x-hidden">
//       <div className="container mx-auto px-4 max-w-6xl">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <Link to="/" className="flex items-center">
//             <span className="text-primary font-bold text-xl">Campus Market</span>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center space-x-4">
//             <Link to="/products" className="text-secondary-700 hover:text-primary">
//               Products
//             </Link>
//             <Link to="/businesses" className="text-secondary-700 hover:text-primary">
//               Businesses
//             </Link>
//             <Link to="/gigs" className="text-secondary-700 hover:text-primary">
//               Gigs
//             </Link>
//             <CampusSelector />

//             {/* Search Form */}
//             <form onSubmit={handleSearch} className="relative">
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-8 pr-4 py-1 rounded-full border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
//               />
//               <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
//             </form>

//             {/* Auth Links */}
//             {isAuthenticated ? (
//               <div className="flex items-center space-x-4">
//                 <Link to="/add-listing" className="btn btn-primary flex items-center text-sm">
//                   <FiPlus className="mr-1" /> Add Listing
//                 </Link>
//                 {isAuthenticated && (
//                   <>
//                     <Link to="/favorites" className="text-secondary-700 hover:text-primary relative">
//                       <FiHeart className="inline-block" />
//                       <span className="ml-1">Favorites</span>
//                       {favorites.length > 0 && (
//                         <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
//                           {favorites.length > 9 ? "9+" : favorites.length}
//                         </span>
//                       )}
//                     </Link>
//                     <Link to="/messages" className="text-secondary-700 hover:text-primary relative">
//                       <FiMessageCircle className="inline-block" />
//                       <span className="ml-1">Messages</span>
//                       {unreadCount > 0 && (
//                         <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
//                           {unreadCount > 9 ? "9+" : unreadCount}
//                         </span>
//                       )}
//                     </Link>
//                   </>
//                 )}
//                 <div
//                   className="relative"
//                   ref={dropdownRef}
//                   onMouseEnter={handleDropdownOpen}
//                   onMouseLeave={handleDropdownClose}
//                 >
//                   <button className="flex items-center text-secondary-700 hover:text-primary">
//                     <FiUser className="mr-1" />
//                     <span className="truncate max-w-[100px]">{user?.name?.split(" ")[0] || "Account"}</span>
//                   </button>
//                   {dropdownOpen && (
//                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
//                       <div className="pt-2 pb-2">
//                         <Link
//                           to="/profile"
//                           className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
//                         >
//                           Profile
//                         </Link>
//                         <Link
//                           to="/dashboard"
//                           className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
//                         >
//                           Dashboard
//                         </Link>
//                         <button
//                           onClick={handleLogout}
//                           className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
//                         >
//                           Sign out
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-3">
//                 <Link
//                   to="/login"
//                   className="px-4 py-1.5 text-primary border border-primary rounded-md hover:bg-primary-50 transition-colors text-sm font-medium"
//                 >
//                   Sign in
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
//                 >
//                   Sign up
//                 </Link>
//               </div>
//             )}
//           </div>

//           {/* Mobile Menu Button */}
//           <div className="md:hidden flex items-center">
//             <button onClick={toggleMenu} className="text-secondary-500 hover:text-primary">
//               {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {isMenuOpen && (
//           <div className="md:hidden fixed top-16 right-0 bg-white shadow-lg z-50 overflow-y-auto overflow-x-hidden py-4 px-4 border-l border-secondary-200 w-3/5 max-h-fit">
//             <form onSubmit={handleSearch} className="relative">
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 rounded-md border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
//               />
//               <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
//             </form>

//             <CampusSelector />

//             <div className="space-y-2 mt-4">
//               <Link
//                 to="/products"
//                 className="block py-2 text-secondary-700 hover:text-primary break-words"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 Products
//               </Link>
//               <Link
//                 to="/businesses"
//                 className="block py-2 text-secondary-700 hover:text-primary break-words"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 Businesses
//               </Link>
//               <Link
//                 to="/gigs"
//                 className="block py-2 text-secondary-700 hover:text-primary break-words"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 Gigs
//               </Link>
//             </div>

//             {isAuthenticated ? (
//               <div className="space-y-2 pt-2 border-t border-secondary-200 mt-4">
//                 <Link
//                   to="/add-listing"
//                   className="flex items-center py-2 text-secondary-700 hover:text-primary break-words"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   <FiPlus className="mr-2 flex-shrink-0" />
//                   <span className="break-words">Add Listing</span>
//                 </Link>
//                 {isAuthenticated && (
//                   <>
//                     <Link
//                       to="/favorites"
//                       className="flex items-center py-2 text-secondary-700 hover:text-primary relative break-words"
//                       onClick={() => setIsMenuOpen(false)}
//                     >
//                       <FiHeart className="mr-2 flex-shrink-0" />
//                       <span className="break-words">Favorites</span>
//                       {favorites.length > 0 && (
//                         <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
//                           {favorites.length}
//                         </span>
//                       )}
//                     </Link>
//                     <Link
//                       to="/messages"
//                       className="flex items-center py-2 text-secondary-700 hover:text-primary relative break-words"
//                       onClick={() => setIsMenuOpen(false)}
//                     >
//                       <FiMessageCircle className="mr-2 flex-shrink-0" />
//                       <span className="break-words">Messages</span>
//                       {unreadCount > 0 && (
//                         <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
//                           {unreadCount}
//                         </span>
//                       )}
//                     </Link>
//                   </>
//                 )}
//                 <Link
//                   to="/dashboard"
//                   className="flex items-center py-2 text-secondary-700 hover:text-primary break-words"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   <FiUser className="mr-2 flex-shrink-0" />
//                   <span className="break-words">Dashboard</span>
//                 </Link>
//                 <Link
//                   to="/profile"
//                   className="flex items-center py-2 text-secondary-700 hover:text-primary break-words"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   <FiUser className="mr-2 flex-shrink-0" />
//                   <span className="break-words">Profile</span>
//                 </Link>
//                 <button
//                   onClick={handleLogout}
//                   className="flex items-center py-2 text-secondary-700 hover:text-primary w-full text-left break-words"
//                 >
//                   <FiLogOut className="mr-2 flex-shrink-0" />
//                   <span className="break-words">Sign out</span>
//                 </button>
//               </div>
//             ) : (
//               <div className="space-y-3 pt-4 border-t border-secondary-200 mt-4">
//                 <Link
//                   to="/login"
//                   className="block w-full py-2 px-4 text-center text-primary border border-primary rounded-md hover:bg-primary-50 transition-colors"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   Sign in
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="block w-full py-2 px-4 text-center bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   Sign up
//                 </Link>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Overlay when menu is open */}
//         {isMenuOpen && (
//           <div
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
//             onClick={() => setIsMenuOpen(false)}
//           ></div>
//         )}
//       </div>
//     </nav>
//   )
// }

// export default Navbar


"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiPlus, FiMessageCircle, FiHeart } from "react-icons/fi"
import CampusSelector from "./CampusSelector"
import axios from "axios"
import { useFavorites } from "../contexts/FavoritesContext"

const Navbar = () => {
  const { user, isAuthenticated, logout, token } = useAuth()
  const { favorites } = useFavorites()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const timeoutRef = useRef(null)

  // Fetch unread messages count
  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchUnreadCount = async () => {
        try {
          const response = await axios.get("/api/messages/unread-count", {
            headers: { Authorization: `Bearer ${token}` },
          })
          setUnreadCount(response.data.count)
        } catch (error) {
          console.error("Error fetching unread messages count:", error)
        }
      }

      fetchUnreadCount()

      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, token])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery("")
      setIsMenuOpen(false)
    }
  }

  const handleLogout = () => {
    try {
      logout()
      navigate("/")
      setIsMenuOpen(false)
      setDropdownOpen(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleDropdownOpen = () => {
    setDropdownOpen(true)
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleDropdownClose = () => {
    // Set a timeout to close the dropdown after 4 seconds
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false)
    }, 4000) // 4 seconds
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <span className="text-primary font-bold text-xl whitespace-nowrap">Campus Market</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-center">
            <Link to="/products" className="text-secondary-700 hover:text-primary whitespace-nowrap">
              Products
            </Link>
            <Link to="/businesses" className="text-secondary-700 hover:text-primary whitespace-nowrap">
              Businesses
            </Link>
            <Link to="/gigs" className="text-secondary-700 hover:text-primary whitespace-nowrap">
              Gigs
            </Link>
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <CampusSelector />

            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1 rounded-full border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm w-40"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            </form>

            {/* Auth Links */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to="/add-listing" className="btn btn-primary flex items-center text-sm whitespace-nowrap">
                  <FiPlus className="mr-1" /> Add Listing
                </Link>
                <Link to="/favorites" className="text-secondary-700 hover:text-primary relative">
                  <FiHeart className="inline-block" />
                  <span className="ml-1 hidden lg:inline">Favorites</span>
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {favorites.length > 9 ? "9+" : favorites.length}
                    </span>
                  )}
                </Link>
                <Link to="/messages" className="text-secondary-700 hover:text-primary relative">
                  <FiMessageCircle className="inline-block" />
                  <span className="ml-1 hidden lg:inline">Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <div
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={handleDropdownOpen}
                  onMouseLeave={handleDropdownClose}
                >
                  <button className="flex items-center text-secondary-700 hover:text-primary">
                    <FiUser className="mr-1" />
                    <span className="truncate max-w-[80px] hidden lg:inline">
                      {user?.name?.split(" ")[0] || "Account"}
                    </span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <div className="pt-2 pb-2">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-primary border border-primary rounded-md hover:bg-primary-50 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-secondary-500 hover:text-primary">
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed top-16 right-0 bg-white shadow-lg z-50 py-4 px-4 border-l border-secondary-200 w-3/5 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            </form>

            <CampusSelector />

            <div className="space-y-2 mt-4">
              <Link
                to="/products"
                className="block py-2 text-secondary-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/businesses"
                className="block py-2 text-secondary-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Businesses
              </Link>
              <Link
                to="/gigs"
                className="block py-2 text-secondary-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Gigs
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="space-y-2 pt-2 border-t border-secondary-200 mt-4">
                <Link
                  to="/add-listing"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPlus className="mr-2 flex-shrink-0" />
                  <span>Add Listing</span>
                </Link>
                <Link
                  to="/favorites"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiHeart className="mr-2 flex-shrink-0" />
                  <span>Favorites</span>
                  {favorites.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {favorites.length}
                    </span>
                  )}
                </Link>
                <Link
                  to="/messages"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiMessageCircle className="mr-2 flex-shrink-0" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
                  )}
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="mr-2 flex-shrink-0" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center py-2 text-secondary-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="mr-2 flex-shrink-0" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center py-2 text-secondary-700 hover:text-primary w-full text-left"
                >
                  <FiLogOut className="mr-2 flex-shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-4 border-t border-secondary-200 mt-4">
                <Link
                  to="/login"
                  className="block w-full py-2 px-4 text-center text-primary border border-primary rounded-md hover:bg-primary-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="block w-full py-2 px-4 text-center bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Overlay when menu is open */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          ></div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
