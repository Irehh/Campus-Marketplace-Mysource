"use client"

import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"
import { API_URL } from "../config"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  // Configure axios defaults
  axios.defaults.baseURL = API_URL

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
    const res = await axios.post("/api/auth/register", userData)

    if (res.data.token) {
      localStorage.setItem("token", res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      toast.success("Registration successful!")
    }

    return res.data
  }

  // Login user
  const login = async (credentials) => {
    const res = await axios.post("/api/auth/login", credentials)

    if (res.data.token) {
      localStorage.setItem("token", res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      toast.success("Login successful!")
    }

    return res.data
  }

  // Logout user
  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    toast.success("Logged out successfully")
  }

  // Update user profile
  const updateProfile = async (userData) => {
    const res = await axios.put("/api/auth/profile", userData)
    setUser(res.data)
    toast.success("Profile updated successfully")
    return res.data
  }

  // Change password
  const changePassword = async (passwordData) => {
    const res = await axios.put("/api/auth/password", passwordData)
    toast.success("Password changed successfully")
    return res.data
  }

  // Google login
  const googleLogin = async (googleToken) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/google-login`, { token: googleToken })

      if (res.data.token) {
        localStorage.setItem("token", res.data.token)
        setToken(res.data.token)
        setUser(res.data.user)
        toast.success("Google login successful!")
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
      const res = await axios.post(`${API_URL}/api/auth/link-telegram`, { telegramId })
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

