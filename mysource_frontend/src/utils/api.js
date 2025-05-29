import axios from "axios"
import { isOnline } from "./indexedDB"

// Create a simple axios instance with minimal configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Skip interceptor for image requests to prevent issues
    if (
      config.url &&
      (config.url.includes("/uploads/") ||
        config.url.endsWith(".jpg") ||
        config.url.endsWith(".png") ||
        config.url.endsWith(".webp") ||
        config.url.endsWith(".jpeg") ||
        config.url.endsWith(".gif"))
    ) {
      return config
    }

    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Don't handle errors for image requests
    if (
      error.config &&
      error.config.url &&
      (error.config.url.includes("/uploads/") ||
        error.config.url.endsWith(".jpg") ||
        error.config.url.endsWith(".png") ||
        error.config.url.endsWith(".webp") ||
        error.config.url.endsWith(".jpeg") ||
        error.config.url.endsWith(".gif"))
    ) {
      return Promise.reject(error)
    }

    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Clear token and redirect to login if not already there
        if (localStorage.getItem("token")) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")

          // Only redirect if not already on login page
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login"
          }
        }
      }
    }
    return Promise.reject(error)
  },
)

// Export the api instance
export default api

// Simple API request methods
export const apiGet = async (url, options = {}) => {
  try {
    // For image requests, use direct axios without any special handling
    if (
      url.includes("/uploads/") ||
      url.endsWith(".jpg") ||
      url.endsWith(".png") ||
      url.endsWith(".webp") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".gif")
    ) {
      return axios.get(url, options)
    }

    // Check if offline
    if (!isOnline()) {
      throw new Error("You are currently offline. Please check your connection and try again.")
    }

    return api.get(url, options)
  } catch (error) {
    console.error("API GET Error:", error)
    throw error
  }
}

export const apiPost = async (url, data, options = {}) => {
  try {
    // Check if offline
    if (!isOnline()) {
      throw new Error("You are currently offline. Please check your connection and try again.")
    }

    return api.post(url, data, options)
  } catch (error) {
    console.error("API POST Error:", error)
    throw error
  }
}

export const apiPut = async (url, data, options = {}) => {
  try {
    // Check if offline
    if (!isOnline()) {
      throw new Error("You are currently offline. Please check your connection and try again.")
    }

    return api.put(url, data, options)
  } catch (error) {
    console.error("API PUT Error:", error)
    throw error
  }
}

export const apiDelete = async (url, options = {}) => {
  try {
    // Check if offline
    if (!isOnline()) {
      throw new Error("You are currently offline. Please check your connection and try again.")
    }

    return api.delete(url, options)
  } catch (error) {
    console.error("API DELETE Error:", error)
    throw error
  }
}

// Direct image URL function that bypasses all interceptors
export const getDirectImageUrl = (imagePath) => {
  if (!imagePath) return null

  // If it's already a full URL, return it
  if (imagePath.startsWith("http")) return imagePath

  // If it's a relative path, construct the full URL
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"

  // Remove /api if it's in the baseUrl since images are at the root
  const imageBaseUrl = baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl

  // Ensure path starts with /uploads/
  const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`

  const path = normalizedPath.includes("/uploads/") ? normalizedPath : `/uploads${normalizedPath}`

  return `${imageBaseUrl}${path}`
}
