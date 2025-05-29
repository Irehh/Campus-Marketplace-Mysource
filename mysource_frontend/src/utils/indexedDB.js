// Simplified indexedDB.js - only keeping essential offline detection functionality

// Check if the device is online
export const isOnline = () => {
  return navigator.onLine
}

// These functions are kept as stubs to prevent breaking existing code
// They don't actually store anything anymore
export const savePendingMessage = async () => {
  console.log("Offline storage disabled")
  return Promise.resolve()
}

export const savePendingProduct = async () => {
  console.log("Offline storage disabled")
  return Promise.resolve()
}

export const savePendingBusiness = async () => {
  console.log("Offline storage disabled")
  return Promise.resolve()
}

// Add an event listener for online/offline status
window.addEventListener("online", () => {
  console.log("Device is now online")
  // Dispatch a custom event that components can listen for
  window.dispatchEvent(new CustomEvent("app:online"))
})

window.addEventListener("offline", () => {
  console.log("Device is now offline")
  // Dispatch a custom event that components can listen for
  window.dispatchEvent(new CustomEvent("app:offline"))
})

// Initialize
export const initIndexedDB = () => {
  console.log("IndexedDB storage disabled, only using online detection")
  return Promise.resolve()
}

// Export a simplified API
export default {
  isOnline,
  savePendingMessage,
  savePendingProduct,
  savePendingBusiness,
  initIndexedDB,
}
