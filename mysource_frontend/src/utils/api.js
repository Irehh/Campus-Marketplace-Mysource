import axios from "axios"
import {
  savePendingMessage,
  savePendingProduct,
  savePendingBusiness,
  cacheData,
  getCachedData,
  triggerBackgroundSync,
  isOnline,
} from "./indexedDB"

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Enhanced API methods with offline support
const enhancedApi = {
  // Original axios instance
  axios: api,

  // GET request with offline cache
  async get(url, config = {}) {
    // Try to get from network first
    if (isOnline()) {
      try {
        const response = await api.get(url, config)

        // Cache the successful response
        const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`
        await cacheData(cacheKey, response.data)

        return response
      } catch (error) {
        console.error("Network request failed, trying cache:", error)

        // If network request fails, try to get from cache
        const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`
        const cachedData = await getCachedData(cacheKey)

        if (cachedData) {
          // Return cached data in a format similar to axios response
          return {
            data: cachedData,
            status: 200,
            statusText: "OK (Cached)",
            headers: {},
            config,
            fromCache: true,
          }
        }

        // If no cached data, rethrow the error
        throw error
      }
    } else {
      // If offline, try to get from cache directly
      const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`
      const cachedData = await getCachedData(cacheKey)

      if (cachedData) {
        // Return cached data
        return {
          data: cachedData,
          status: 200,
          statusText: "OK (Cached)",
          headers: {},
          config,
          fromCache: true,
        }
      }

      // If no cached data, throw a network error
      throw new Error("You are offline and no cached data is available")
    }
  },

  // POST request with offline support
  async post(url, data, config = {}) {
    if (isOnline()) {
      // If online, send normally
      return api.post(url, data, config)
    } else {
      // If offline, store for later sync
      const token = localStorage.getItem("token")

      if (url.includes("/messages")) {
        // Store message for later sync
        await savePendingMessage(data, token)
        await triggerBackgroundSync("sync-messages")

        // Return a mock response
        return {
          data: {
            id: "pending-" + Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            pendingSync: true,
          },
          status: 202,
          statusText: "Accepted (Pending Sync)",
          config,
          offline: true,
        }
      } else if (url.includes("/products")) {
        // Store product for later sync
        await savePendingProduct(data, token)
        await triggerBackgroundSync("sync-products")

        // Return a mock response
        return {
          data: {
            id: "pending-" + Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            pendingSync: true,
          },
          status: 202,
          statusText: "Accepted (Pending Sync)",
          config,
          offline: true,
        }
      } else if (url.includes("/businesses")) {
        // Store business for later sync
        await savePendingBusiness(data, token)
        await triggerBackgroundSync("sync-businesses")

        // Return a mock response
        return {
          data: {
            id: "pending-" + Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            pendingSync: true,
          },
          status: 202,
          statusText: "Accepted (Pending Sync)",
          config,
          offline: true,
        }
      }

      // For other endpoints, throw an error
      throw new Error("You are offline. This action will be available when you reconnect.")
    }
  },

  // PUT request (no offline support yet)
  put(url, data, config = {}) {
    return api.put(url, data, config)
  },

  // DELETE request (no offline support yet)
  delete(url, config = {}) {
    return api.delete(url, config)
  },
}

// DEVELOPMENT ONLY: Log API calls
if (process.env.NODE_ENV !== "production") {
  // Add request logging
  api.interceptors.request.use(
    (config) => {
      console.log(`%c[API Request] ${config.method.toUpperCase()} ${config.url}`, "color: #3498db", config)
      return config
    },
    (error) => {
      console.error(`%c[API Request Error]`, "color: #e74c3c", error)
      return Promise.reject(error)
    },
  )

  // Add response logging
  api.interceptors.response.use(
    (response) => {
      console.log(
        `%c[API Response] ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`,
        "color: #2ecc71",
        response,
      )
      return response
    },
    (error) => {
      console.error(`%c[API Response Error] ${error.response?.status || "Network Error"}`, "color: #e74c3c", error)
      return Promise.reject(error)
    },
  )
}

export default enhancedApi

