const webpush = require('web-push');
const { PushSubscription } = require('../models');

// Configure web-push with VAPID keys
exports.configurePushNotifications = () => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not provided, push notifications will not work');
      return false;
    }

    webpush.setVapidDetails(
      `mailto:${process.env.EMAIL_FROM || 'example@example.com'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    console.info('Push notifications configured successfully');
    return true;
  } catch (error) {
    console.error('Failed to configure push notifications:', error.message);
    return false;
  }
};

// Get VAPID public key
exports.getVapidPublicKey = (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({ message: 'VAPID public key not configured' });
  }

  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// Subscribe to push notifications
exports.subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    let userId = req.user?.id; // May be undefined for anonymous users

    // Validate subscription
    if (!subscription || typeof subscription !== 'object' || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Valid subscription object is required' });
    }

    // Parse userId to integer if present
    if (userId) {
      userId = parseInt(userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
    }

    // Store the subscription
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      ...(userId && { userId }),
    };

    await PushSubscription.upsert(subscriptionData);

    console.info(`Push subscription ${userId ? `for user ${userId}` : 'anonymous'} stored successfully`);

    // Send a test notification
    try {
      const payload = JSON.stringify({
        title: 'Subscription Successful',
        body: 'You have successfully subscribed to push notifications!',
        icon: '/logo192.png',
        badge: '/badge.png',
        tag: 'welcome',
      });

      await webpush.sendNotification(subscription, payload);
    } catch (error) {
      console.error('Error sending test notification:', error);
      // Continue even if test notification fails
    }

    res.status(201).json({ message: 'Subscription successful' });
  } catch (error) {
    console.error('Error storing push subscription:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid subscription data' });
    }
    res.status(500).json({ message: 'Failed to store subscription' });
  }
};

// Unsubscribe from push notifications
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    // Validate endpoint
    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ message: 'Valid endpoint is required' });
    }

    // Delete the subscription
    const deleted = await PushSubscription.destroy({
      where: { endpoint },
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    console.info('Push subscription removed successfully');
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
};

// Send notification to a specific user
exports.sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // Parse userId to integer
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      console.warn('Invalid user ID provided for notification');
      return false;
    }

    // Get all subscriptions for this user
    const subscriptions = await PushSubscription.findAll({
      where: { userId: parsedUserId },
    });

    if (subscriptions.length === 0) {
      console.warn(`No push subscriptions found for user ${parsedUserId}`);
      return false;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/badge.png',
      data,
    });

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
          };

          await webpush.sendNotification(subscription, payload);
          return true;
        } catch (error) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await PushSubscription.destroy({
              where: { id: sub.id },
            });
            console.warn(`Removed invalid subscription for user ${parsedUserId}`);
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    console.info(`Sent push notifications to ${successful}/${subscriptions.length} devices for user ${parsedUserId}`);

    return successful > 0;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Send notification to all users
exports.sendNotificationToAll = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    // Validate inputs
    if (!title || !body || typeof title !== 'string' || typeof body !== 'string') {
      return res.status(400).json({ message: 'Title and body are required and must be strings' });
    }

    // Parse userId to integer
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if user is admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to send notifications to all users' });
    }

    // Get all subscriptions
    const subscriptions = await PushSubscription.findAll();

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No push subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/badge.png',
      data: data || {},
    });

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
          };

          await webpush.sendNotification(subscription, payload);
          return true;
        } catch (error) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await PushSubscription.destroy({
              where: { id: sub.id },
            });
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    console.info(`Sent push notifications to ${successful}/${subscriptions.length} devices`);

    res.json({
      message: `Notification sent to ${successful} devices`,
      total: subscriptions.length,
      successful,
    });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    res.status(500).json({ message: 'Failed to send notifications' });
  }
};