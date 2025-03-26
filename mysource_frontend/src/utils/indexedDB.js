// Database name and version
const DB_NAME = "campus-marketplace"
const DB_VERSION = 1

// Object store names
const STORES = {
  MESSAGES: "pending-messages",
  PRODUCTS: "pending-products",
  BUSINESSES: "pending-businesses",
  CACHE: "cache-data",
}

// Open the database
export const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        db.createObjectStore(STORES.MESSAGES, { keyPath: "id", autoIncrement: true })
      }

      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: "id", autoIncrement: true })
      }

      if (!db.objectStoreNames.contains(STORES.BUSINESSES)) {
        db.createObjectStore(STORES.BUSINESSES, { keyPath: "id", autoIncrement: true })
      }

      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        db.createObjectStore(STORES.CACHE, { keyPath: "key" })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error)
      reject(event.target.error)
    }
  })
}

// Save a pending message
export const savePendingMessage = async (message, token) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORES.MESSAGES, "readwrite")
    const store = transaction.objectStore(STORES.MESSAGES)

    const item = {
      data: message,
      token,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const request = store.add(item)

      request.onsuccess = (event) => {
        resolve(event.target.result) // Returns the ID
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error("Error saving pending message:", error)
    throw error
  }
}

// Save a pending product
export const savePendingProduct = async (product, token) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORES.PRODUCTS, "readwrite")
    const store = transaction.objectStore(STORES.PRODUCTS)

    const item = {
      data: product,
      token,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const request = store.add(item)

      request.onsuccess = (event) => {
        resolve(event.target.result) // Returns the ID
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error("Error saving pending product:", error)
    throw error
  }
}

// Save a pending business
export const savePendingBusiness = async (business, token) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORES.BUSINESSES, "readwrite")
    const store = transaction.objectStore(STORES.BUSINESSES)

    const item = {
      data: business,
      token,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const request = store.add(item)

      request.onsuccess = (event) => {
        resolve(event.target.result) // Returns the ID
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error("Error saving pending business:", error)
    throw error
  }
}

// Cache data for offline use
export const cacheData = async (key, data) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORES.CACHE, "readwrite")
    const store = transaction.objectStore(STORES.CACHE)

    return new Promise((resolve, reject) => {
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
      })

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error("Error caching data:", error)
    throw error
  }
}

// Get cached data
export const getCachedData = async (key) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORES.CACHE, "readonly")
    const store = transaction.objectStore(STORES.CACHE)

    return new Promise((resolve, reject) => {
      const request = store.get(key)

      request.onsuccess = (event) => {
        resolve(event.target.result?.data || null)
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  } catch (error) {
    console.error("Error getting cached data:", error)
    throw error
  }
}

// Trigger background sync
export const triggerBackgroundSync = async (syncTag) => {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(syncTag)
      return true
    } catch (error) {
      console.error("Background sync registration failed:", error)
      return false
    }
  } else {
    console.warn("Background sync not supported")
    return false
  }
}

// Check if we're online
export const isOnline = () => {
  return navigator.onLine
}

