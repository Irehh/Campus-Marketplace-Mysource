// Check if push notifications are supported
export const isPushNotificationSupported = () => {
    return "serviceWorker" in navigator && "PushManager" in window
  }
  
  // Request permission for push notifications
  export const requestNotificationPermission = async () => {
    if (!isPushNotificationSupported()) {
      return { permission: false, error: "Push notifications not supported" }
    }
  
    try {
      const permission = await Notification.requestPermission()
      return { permission: permission === "granted", error: null }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return { permission: false, error: error.message }
    }
  }
  
  // Register service worker
  export const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported")
    }
  
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js")
      return registration
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      throw error
    }
  }
  
  // Subscribe to push notifications
  export const subscribeToPushNotifications = async (userId) => {
    if (!isPushNotificationSupported()) {
      throw new Error("Push notifications not supported")
    }
  
    try {
      // Request permission
      const permissionResult = await requestNotificationPermission()
      if (!permissionResult.permission) {
        throw new Error("Permission denied")
      }
  
      // Register service worker
      const registration = await registerServiceWorker()
  
      // Get subscription
      let subscription = await registration.pushManager.getSubscription()
  
      // If no subscription exists, create one
      if (!subscription) {
        // Get public key from server
        const response = await fetch("/api/push/vapid-public-key")
        const vapidPublicKey = await response.text()
  
        // Convert public key to Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)
  
        // Subscribe
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })
      }
  
      // Send subscription to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userId,
        }),
      })
  
      return subscription
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
      throw error
    }
  }
  
  // Unsubscribe from push notifications
  export const unsubscribeFromPushNotifications = async () => {
    if (!isPushNotificationSupported()) {
      throw new Error("Push notifications not supported")
    }
  
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
  
      if (subscription) {
        // Unsubscribe
        await subscription.unsubscribe()
  
        // Notify server
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        })
      }
  
      return true
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
      throw error
    }
  }
  
  // Helper function to convert base64 to Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
  
    return outputArray
  }
  
  