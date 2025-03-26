import webpush from "web-push"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Configure web-push with VAPID keys
export const configurePushNotifications = () => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn("VAPID keys not provided, push notifications will not work")
      return false
    }

    webpush.setVapidDetails(
      `mailto:${process.env.EMAIL_FROM || "example@example.com"}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    )

    console.info("Push notifications configured successfully")
    return true
  } catch (error) {
    console.error("Failed to configure push notifications:", error.message)
    return false
  }
}

// Get VAPID public key
export const getVapidPublicKey = (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({ message: "VAPID public key not configured" })
  }

  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}

// Subscribe to push notifications
export const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body
    const userId = req.user?.id

    if (!subscription) {
      return res.status(400).json({ message: "Subscription object is required" })
    }

    // Store the subscription
    if (userId) {
      // If user is logged in, associate subscription with user
      await prisma.pushSubscription.upsert({
        where: {
          endpoint: subscription.endpoint,
        },
        update: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      })
    } else {
      // If user is not logged in, store subscription without user association
      await prisma.pushSubscription.upsert({
        where: {
          endpoint: subscription.endpoint,
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        create: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      })
    }

    console.info(`Push subscription ${userId ? `for user ${userId}` : "anonymous"} stored successfully`)

    // Send a test notification
    try {
      const payload = JSON.stringify({
        title: "Subscription Successful",
        body: "You have successfully subscribed to push notifications!",
        icon: "/logo192.png",
        badge: "/badge.png",
        tag: "welcome",
      })

      await webpush.sendNotification(subscription, payload)
    } catch (error) {
      console.error("Error sending test notification:", error)
      // Continue even if test notification fails
    }

    res.status(201).json({ message: "Subscription successful" })
  } catch (error) {
    console.error("Error storing push subscription:", error)
    res.status(500).json({ message: "Failed to store subscription" })
  }
}

// Unsubscribe from push notifications
export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" })
    }

    // Delete the subscription
    await prisma.pushSubscription.delete({
      where: {
        endpoint,
      },
    })

    console.info("Push subscription removed successfully")
    res.json({ message: "Unsubscribed successfully" })
  } catch (error) {
    console.error("Error removing push subscription:", error)
    res.status(500).json({ message: "Failed to unsubscribe" })
  }
}

// Send notification to a specific user
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    if (!userId) {
      console.warn("User ID is required to send notification")
      return false
    }

    // Get all subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
      },
    })

    if (subscriptions.length === 0) {
      console.warn(`No push subscriptions found for user ${userId}`)
      return false
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/logo192.png",
      badge: "/badge.png",
      data,
    })

    // Send notification to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          await webpush.sendNotification(subscription, payload)
          return true
        } catch (error) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: {
                id: sub.id,
              },
            })
            console.warn(`Removed invalid subscription for user ${userId}`)
          }
          throw error
        }
      }),
    )

    const successful = results.filter((r) => r.status === "fulfilled").length
    console.info(`Sent push notifications to ${successful}/${subscriptions.length} devices for user ${userId}`)

    return successful > 0
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}

// Send notification to all users
export const sendNotificationToAll = async (req, res) => {
  try {
    const { title, body, data } = req.body

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" })
    }

    // Check if user is admin
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to send notifications to all users" })
    }

    // Get all subscriptions
    const subscriptions = await prisma.pushSubscription.findMany()

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: "No push subscriptions found" })
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/logo192.png",
      badge: "/badge.png",
      data: data || {},
    })

    // Send notification to all devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          await webpush.sendNotification(subscription, payload)
          return true
        } catch (error) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: {
                id: sub.id,
              },
            })
          }
          throw error
        }
      }),
    )

    const successful = results.filter((r) => r.status === "fulfilled").length
    console.info(`Sent push notifications to ${successful}/${subscriptions.length} devices`)

    res.json({
      message: `Notification sent to ${successful} devices`,
      total: subscriptions.length,
      successful,
    })
  } catch (error) {
    console.error("Error sending push notifications:", error)
    res.status(500).json({ message: "Failed to send notifications" })
  }
}

