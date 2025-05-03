

// import { createContext, useState, useEffect, useContext } from "react"
// import axios from "axios"
// import { REACT_APP_REACT_APP_API_URL } from "../config"
// import toast from "react-hot-toast"

// const AuthContext = createContext()

// export const useAuth = () => useContext(AuthContext)

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [token, setToken] = useState(localStorage.getItem("token"))
//   const [loading, setLoading] = useState(true)

//   // Configure axios defaults
//   axios.defaults.baseURL = REACT_APP_REACT_APP_API_URL

//   // Set auth token for all requests if available
//   useEffect(() => {
//     if (token) {
//       axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
//     } else {
//       delete axios.defaults.headers.common["Authorization"]
//     }
//   }, [token])

//   // Load user on initial render if token exists
//   useEffect(() => {
//     const loadUser = async () => {
//       if (!token) {
//         setLoading(false)
//         return
//       }

//       try {
//         const res = await axios.get("/api/auth/me")
//         setUser(res.data)
//       } catch (error) {
//         console.error("Error loading user:", error)
//         // If token is invalid, clear it
//         localStorage.removeItem("token")
//         setToken(null)
//         toast.error("Session expired. Please log in again.")
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadUser()
//   }, [token])

//   // Register user
//   const register = async (userData) => {
//     try {
//       const res = await axios.post("/api/auth/register", userData)

//       if (res.data.token) {
//         localStorage.setItem("token", res.data.token)
//         setToken(res.data.token)
//         setUser(res.data.user)
//         toast.success("Registration successful!")
//       }

//       return res.data
//     } catch (error) {
//       console.error("Registration error:", error)
//       const message = error.response?.data?.message || "Registration failed. Please try again."
//       toast.error(message)
//       throw error
//     }
//   }

//   // Login user
//   const login = async (credentials) => {
//     try {
//       const res = await axios.post("/api/auth/login", credentials)

//       if (res.data.token) {
//         localStorage.setItem("token", res.data.token)
//         setToken(res.data.token)
//         setUser(res.data.user)
//         toast.success("Login successful!")
//       }

//       return res.data
//     } catch (error) {
//       console.error("Login error:", error)
//       const message = error.response?.data?.message || "Login failed. Please check your credentials."
//       toast.error(message)
//       throw error
//     }
//   }

//   // Logout user
//   const logout = () => {
//     try {
//       localStorage.removeItem("token")
//       setToken(null)
//       setUser(null)
//       toast.success("Logged out successfully")
//     } catch (error) {
//       console.error("Logout error:", error)
//       toast.error("Error during logout")
//     }
//   }

//   // Update user profile
//   const updateProfile = async (userData) => {
//     try {
//       const res = await axios.put("/api/auth/profile", userData)
//       setUser(res.data)
//       toast.success("Profile updated successfully")
//       return res.data
//     } catch (error) {
//       console.error("Error updating profile:", error)
//       toast.error("Failed to update profile")
//       throw error
//     }
//   }

//   // Change password
//   const changePassword = async (passwordData) => {
//     try {
//       const res = await axios.put("/api/auth/password", passwordData)
//       toast.success("Password changed successfully")
//       return res.data
//     } catch (error) {
//       console.error("Error changing password:", error)
//       toast.error("Failed to change password")
//       throw error
//     }
//   }

//   // Google login
//   const googleLogin = async (googleToken) => {
//     try {
//       const res = await axios.post(`${REACT_APP_REACT_APP_API_URL}/api/auth/google-login`, { token: googleToken })

//       if (res.data.token) {
//         localStorage.setItem("token", res.data.token)
//         setToken(res.data.token)
//         setUser(res.data.user)
//         toast.success("Google login successful!")
//       }

//       return res.data
//     } catch (error) {
//       console.error("Google login error:", error)
//       toast.error("Google login failed. Please try again.")
//       throw error
//     }
//   }

//   // Link Telegram account
//   const linkTelegramAccount = async (telegramId) => {
//     try {
//       const res = await axios.post(`${REACT_APP_REACT_APP_API_URL}/api/auth/link-telegram`, { telegramId })
//       setUser(res.data.user)
//       toast.success("Telegram account linked successfully!")
//       return res.data
//     } catch (error) {
//       console.error("Error linking Telegram account:", error)
//       toast.error("Failed to link Telegram account")
//       throw error
//     }
//   }

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         token,
//         loading,
//         register,
//         login,
//         logout,
//         updateProfile,
//         changePassword,
//         googleLogin,
//         linkTelegramAccount,
//         isAuthenticated: !!user,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   )
// }



"use client"

import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"
import { REACT_APP_API_URL } from "../config"
import toast from "react-hot-toast"
import Cookies from "js-cookie"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  // Configure axios defaults
  axios.defaults.baseURL = REACT_APP_API_URL

  // Set auth token for all requests if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common["Authorization"]
    }
  }, [token])

  // Load user on initial render if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await axios.get("/api/auth/me")
        setUser(res.data)
      } catch (error) {
        console.error("Error loading user:", error)
        // If token is invalid, clear it
        localStorage.removeItem("token")
        setToken(null)
        toast.error("Session expired. Please log in again.")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [token])

  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post("/api/auth/register", userData)

      if (res.data.token) {
        localStorage.setItem("token", res.data.token)
        setToken(res.data.token)
        setUser(res.data.user)
        toast.success("Registration successful!")

        // Set campus cookie and refresh page to update campus-specific content
        if (res.data.user.campus) {
          Cookies.set("userCampus", res.data.user.campus, { expires: 30 })
          window.location.reload()
        }
      }

      return res.data
    } catch (error) {
      console.error("Registration error:", error)
      const message = error.response?.data?.message || "Registration failed. Please try again."
      toast.error(message)
      throw error
    }
  }

  // Login user
  const login = async (credentials) => {
    try {
      const res = await axios.post("/api/auth/login", credentials)

      if (res.data.token) {
        localStorage.setItem("token", res.data.token)
        setToken(res.data.token)
        setUser(res.data.user)
        toast.success("Login successful!")

        // Set campus cookie and refresh page to update campus-specific content
        if (res.data.user.campus) {
          Cookies.set("userCampus", res.data.user.campus, { expires: 30 })
          window.location.reload()
        }
      }

      return res.data
    } catch (error) {
      console.error("Login error:", error)
      const message = error.response?.data?.message || "Login failed. Please check your credentials."
      toast.error(message)
      throw error
    }
  }

  // Logout user
  const logout = async () => {
    try {
      // Clear user data from localStorage
      localStorage.removeItem("token")

      // Clear user-specific caches
      if ("caches" in window) {
        try {
          // Clear user-specific cache
          const userCacheNames = ["user-data-cache", "user-messages-cache"]

          // Delete specific caches
          for (const cacheName of userCacheNames) {
            await caches.delete(cacheName)
          }

          // Clear IndexedDB data
          if (window.indexedDB) {
            const dbNames = ["campus-marketplace", "campus-marketplace-sync"]
            for (const dbName of dbNames) {
              window.indexedDB.deleteDatabase(dbName)
            }
          }

          console.log("User-specific caches cleared")
        } catch (cacheError) {
          console.error("Error clearing caches:", cacheError)
        }
      }

      // Reset state
      setToken(null)
      setUser(null)

      toast.success("Logged out successfully")

      // Refresh the page to ensure all user data is cleared from memory
      window.location.reload()
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Error during logout")
    }
  }

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await axios.put("/api/auth/profile", userData)

      // Check if campus was updated
      const campusChanged = user && res.data && user.campus !== res.data.campus

      setUser(res.data)
      toast.success("Profile updated successfully")

      // If campus was changed, update cookie and refresh
      if (campusChanged && res.data.campus) {
        Cookies.set("userCampus", res.data.campus, { expires: 30 })
        window.location.reload()
      }

      return res.data
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
      throw error
    }
  }

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const res = await axios.put("/api/auth/password", passwordData)
      toast.success("Password changed successfully")
      return res.data
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed to change password")
      throw error
    }
  }

  // Google login
  const googleLogin = async (googleToken) => {
    try {
      const res = await axios.post(`${REACT_APP_API_URL}/api/auth/google-login`, { token: googleToken })

      if (res.data.token) {
        localStorage.setItem("token", res.data.token)
        setToken(res.data.token)
        setUser(res.data.user)
        toast.success("Google login successful!")

        // Set campus cookie and refresh page to update campus-specific content
        if (res.data.user.campus) {
          Cookies.set("userCampus", res.data.user.campus, { expires: 30 })
          window.location.reload()
        }
      }

      return res.data
    } catch (error) {
      console.error("Google login error:", error)
      toast.error("Google login failed. Please try again.")
      throw error
    }
  }

  // Link Telegram account
  const linkTelegramAccount = async (telegramId) => {
    try {
      const res = await axios.post(`${REACT_APP_API_URL}/api/auth/link-telegram`, { telegramId })
      setUser(res.data.user)
      toast.success("Telegram account linked successfully!")
      return res.data
    } catch (error) {
      console.error("Error linking Telegram account:", error)
      toast.error("Failed to link Telegram account")
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        googleLogin,
        linkTelegramAccount,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
