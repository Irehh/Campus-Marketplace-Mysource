const { Order, OrderItem, Cart, CartItem, Product, Image, User, Wallet, Transaction } = require("../models")
const { Op, sequelize } = require("sequelize")
const { sendEmail } = require("../utils/emailUtils")
const emailTemplates = require("../utils/emailTemplates")
const { sendTelegramMessage } = require("./telegramController")

// Create order from cart
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const userId = req.user.id
    const { deliveryMethod = "pickup", deliveryAddress, notes } = req.body

    // Get user's cart with items
    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: Product,
              include: [
                {
                  model: User,
                  attributes: ["id", "name", "email", "campus"],
                },
                {
                  model: Image,
                  limit: 1,
                },
              ],
            },
          ],
        },
      ],
      transaction,
    })

    if (!cart || cart.CartItems.length === 0) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      })
    }

    // Get buyer's wallet
    let buyerWallet = await Wallet.findOne({
      where: { userId },
      transaction,
    })

    if (!buyerWallet) {
      buyerWallet = await Wallet.create(
        {
          userId,
          balance: 0,
        },
        { transaction },
      )
    }

    // Group cart items by seller
    const ordersBySeller = {}

    for (const cartItem of cart.CartItems) {
      const sellerId = cartItem.Product.userId
      const sellerKey = `seller_${sellerId}`

      if (!ordersBySeller[sellerKey]) {
        ordersBySeller[sellerKey] = {
          sellerId,
          seller: cartItem.Product.User,
          items: [],
          totalAmount: 0,
        }
      }

      ordersBySeller[sellerKey].items.push(cartItem)
      ordersBySeller[sellerKey].totalAmount += Number.parseFloat(cartItem.price) * cartItem.quantity
    }

    const createdOrders = []

    // Create separate orders for each seller
    for (const [sellerKey, orderData] of Object.entries(ordersBySeller)) {
      const { sellerId, seller, items, totalAmount } = orderData

      // Calculate platform fee
      const { calculatePlatformFee } = require("../utils/feeCalculator")
      const feeCalculation = calculatePlatformFee(totalAmount, req.user.campus)
      const platformFee = feeCalculation.fee
      const orderTotal = totalAmount + platformFee

      // Check if buyer has sufficient balance (including platform fee)
      if (buyerWallet.balance < orderTotal) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. You need ₦${orderTotal.toFixed(2)} (₦${totalAmount.toFixed(2)} + ₦${platformFee} platform fee) but only have ₦${buyerWallet.balance.toFixed(2)}`,
          requiredAmount: orderTotal,
          currentBalance: buyerWallet.balance,
          breakdown: {
            subtotal: totalAmount,
            platformFee,
            total: orderTotal,
          },
        })
      }

      // Generate order number
      const orderNumber = Order.generateOrderNumber()

      // Create order with fee breakdown
      const order = await Order.create(
        {
          orderNumber,
          buyerId: userId,
          sellerId,
          subtotal: totalAmount,
          platformFee,
          totalAmount: orderTotal,
          deliveryMethod,
          deliveryAddress,
          notes,
          campus: req.user.campus || seller.campus,
        },
        { transaction },
      )

      // Create order items with product snapshots
      for (const cartItem of items) {
        const productSnapshot = {
          id: cartItem.Product.id,
          title: cartItem.Product.title,
          description: cartItem.Product.description,
          price: cartItem.Product.price,
          category: cartItem.Product.category,
          images: cartItem.Product.Images || [],
        }

        await OrderItem.create(
          {
            orderId: order.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            price: cartItem.price,
            productSnapshot,
          },
          { transaction },
        )
      }

      // Deduct total amount from buyer's wallet (escrow + platform fee)
      buyerWallet.balance -= orderTotal
      await buyerWallet.save({ transaction })

      // Create escrow transaction for seller amount
      await Transaction.create(
        {
          userId,
          type: "escrow_hold",
          amount: -totalAmount,
          description: `Escrow hold for order ${orderNumber}`,
          status: "completed",
          reference: `escrow_${orderNumber}`,
          orderId: order.id,
        },
        { transaction },
      )

      // Create platform fee transaction
      await Transaction.create(
        {
          userId,
          type: "platform_fee",
          amount: -platformFee,
          description: `Platform fee for order ${orderNumber}`,
          status: "completed",
          reference: `fee_${orderNumber}`,
          orderId: order.id,
        },
        { transaction },
      )

      createdOrders.push(order)

      // Send notifications with fee breakdown
      try {
        // Email to buyer
        const buyerEmailData = emailTemplates.orderCreated(
          req.user.name,
          orderNumber,
          totalAmount,
          platformFee,
          orderTotal,
          `${process.env.FRONTEND_URL}/orders/${order.id}`,
        )
        await sendEmail({
          to: req.user.email,
          ...buyerEmailData,
        })

        // Email to seller (seller gets the subtotal, not including platform fee)
        const sellerEmailData = emailTemplates.newOrderReceived(
          seller.name,
          orderNumber,
          totalAmount, // Seller sees their amount without platform fee
          `${process.env.FRONTEND_URL}/orders/${order.id}`,
        )
        await sendEmail({
          to: seller.email,
          ...sellerEmailData,
        })

        // Telegram notifications
        await sendTelegramMessage(
          sellerId,
          `🛒 New Order Received!\n\nOrder: ${orderNumber}\nAmount: ₦${totalAmount.toFixed(2)}\nFrom: ${req.user.name}\n\nView details: ${process.env.FRONTEND_URL}/orders/${order.id}`,
        )

        await sendTelegramMessage(
          userId,
          `✅ Order Placed Successfully!\n\nOrder: ${orderNumber}\nSubtotal: ₦${totalAmount.toFixed(2)}\nPlatform Fee: ₦${platformFee}\nTotal: ₦${orderTotal.toFixed(2)}\nSeller: ${seller.name}\n\nTrack your order: ${process.env.FRONTEND_URL}/orders/${order.id}`,
        )
      } catch (notificationError) {
        console.error("Error sending order notifications:", notificationError)
      }
    }

    // Clear cart after successful order creation
    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction,
    })

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: `${createdOrders.length} order(s) created successfully`,
      data: {
        orders: createdOrders,
        totalOrders: createdOrders.length,
      },
    })
  } catch (error) {
    await transaction.rollback()
    console.error("Error creating order:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    })
  }
}

// Get user's orders (as buyer)
const getBuyerOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10, status } = req.query
    const offset = (page - 1) * limit

    const whereClause = { buyerId: userId }
    if (status) {
      whereClause.status = status
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "seller",
          attributes: ["id", "name", "email", "campus"],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Image,
                  limit: 1,
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })

    res.status(200).json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(orders.count / limit),
          totalOrders: orders.count,
          hasNext: offset + orders.rows.length < orders.count,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Error getting buyer orders:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    })
  }
}

// Get user's orders (as seller)
const getSellerOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10, status } = req.query
    const offset = (page - 1) * limit

    const whereClause = { sellerId: userId }
    if (status) {
      whereClause.status = status
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "campus"],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Image,
                  limit: 1,
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })

    res.status(200).json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(orders.count / limit),
          totalOrders: orders.count,
          hasNext: offset + orders.rows.length < orders.count,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Error getting seller orders:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    })
  }
}

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user.id

    const order = await Order.findOne({
      where: {
        id: orderId,
        [Op.or]: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "campus"],
        },
        {
          model: User,
          as: "seller",
          attributes: ["id", "name", "email", "campus"],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Image,
                },
              ],
            },
          ],
        },
      ],
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.status(200).json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error("Error getting order details:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get order details",
      error: error.message,
    })
  }
}

// Update delivery status (seller only)
const updateDeliveryStatus = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { orderId } = req.params
    const { deliveryStatus, sellerNotes } = req.body
    const userId = req.user.id

    const validStatuses = ["pending", "preparing", "ready_for_pickup", "in_transit", "delivered"]

    if (!validStatuses.includes(deliveryStatus)) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
      })
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        sellerId: userId,
      },
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email"],
        },
      ],
      transaction,
    })

    if (!order) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: "Order not found or you are not authorized to update it",
      })
    }

    const oldStatus = order.deliveryStatus
    order.deliveryStatus = deliveryStatus

    if (sellerNotes) {
      order.sellerNotes = sellerNotes
    }

    if (deliveryStatus === "delivered") {
      order.deliveryConfirmedAt = new Date()
    }

    await order.save({ transaction })

    await transaction.commit()

    // Send notifications
    try {
      const statusMessages = {
        preparing: "Your order is being prepared",
        ready_for_pickup: "Your order is ready for pickup",
        in_transit: "Your order is on the way",
        delivered: "Your order has been delivered",
      }

      // Email notification
      const emailData = emailTemplates.deliveryStatusUpdate(
        order.buyer.name,
        order.orderNumber,
        statusMessages[deliveryStatus],
        `${process.env.FRONTEND_URL}/orders/${order.id}`,
      )
      await sendEmail({
        to: order.buyer.email,
        ...emailData,
      })

      // Telegram notification
      await sendTelegramMessage(
        order.buyerId,
        `📦 Delivery Update!\n\nOrder: ${order.orderNumber}\nStatus: ${statusMessages[deliveryStatus]}\n\n${sellerNotes ? `Note: ${sellerNotes}\n\n` : ""}View order: ${process.env.FRONTEND_URL}/orders/${order.id}`,
      )
    } catch (notificationError) {
      console.error("Error sending delivery status notifications:", notificationError)
    }

    res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      data: order,
    })
  } catch (error) {
    await transaction.rollback()
    console.error("Error updating delivery status:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update delivery status",
      error: error.message,
    })
  }
}

// Confirm delivery (buyer only)
const confirmDelivery = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { orderId } = req.params
    const { buyerNotes } = req.body
    const userId = req.user.id

    const order = await Order.findOne({
      where: {
        id: orderId,
        buyerId: userId,
      },
      include: [
        {
          model: User,
          as: "seller",
          attributes: ["id", "name", "email"],
        },
      ],
      transaction,
    })

    if (!order) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: "Order not found or you are not authorized to confirm it",
      })
    }

    if (order.escrowReleased) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Payment has already been released for this order",
      })
    }

    // Update order
    order.deliveryStatus = "confirmed_by_buyer"
    order.status = "completed"
    order.buyerConfirmedAt = new Date()
    order.escrowReleased = true
    order.escrowReleasedAt = new Date()

    if (buyerNotes) {
      order.buyerNotes = buyerNotes
    }

    await order.save({ transaction })

    // Release escrow to seller
    let sellerWallet = await Wallet.findOne({
      where: { userId: order.sellerId },
      transaction,
    })

    if (!sellerWallet) {
      sellerWallet = await Wallet.create(
        {
          userId: order.sellerId,
          balance: 0,
        },
        { transaction },
      )
    }

    sellerWallet.balance += Number.parseFloat(order.totalAmount)
    await sellerWallet.save({ transaction })

    // Create transaction record for seller
    await Transaction.create(
      {
        userId: order.sellerId,
        type: "escrow_release",
        amount: Number.parseFloat(order.totalAmount),
        description: `Payment received for order ${order.orderNumber}`,
        status: "completed",
        reference: `release_${order.orderNumber}`,
        orderId: order.id,
      },
      { transaction },
    )

    await transaction.commit()

    // Send notifications
    try {
      // Email to seller
      const sellerEmailData = emailTemplates.paymentReleased(
        order.seller.name,
        order.orderNumber,
        order.totalAmount,
        `${process.env.FRONTEND_URL}/orders/${order.id}`,
      )
      await sendEmail({
        to: order.seller.email,
        ...sellerEmailData,
      })

      // Email to buyer
      const buyerEmailData = emailTemplates.orderCompleted(
        req.user.name,
        order.orderNumber,
        `${process.env.FRONTEND_URL}/orders/${order.id}`,
      )
      await sendEmail({
        to: req.user.email,
        ...buyerEmailData,
      })

      // Telegram notifications
      await sendTelegramMessage(
        order.sellerId,
        `💰 Payment Released!\n\nOrder: ${order.orderNumber}\nAmount: ₦${order.totalAmount}\n\nThe buyer has confirmed delivery and payment has been released to your wallet.\n\nView order: ${process.env.FRONTEND_URL}/orders/${order.id}`,
      )

      await sendTelegramMessage(
        userId,
        `✅ Order Completed!\n\nOrder: ${order.orderNumber}\n\nThank you for confirming delivery. The payment has been released to the seller.\n\nView order: ${process.env.FRONTEND_URL}/orders/${order.id}`,
      )
    } catch (notificationError) {
      console.error("Error sending delivery confirmation notifications:", notificationError)
    }

    res.status(200).json({
      success: true,
      message: "Delivery confirmed and payment released successfully",
      data: order,
    })
  } catch (error) {
    await transaction.rollback()
    console.error("Error confirming delivery:", error)
    res.status(500).json({
      success: false,
      message: "Failed to confirm delivery",
      error: error.message,
    })
  }
}

// Cancel order
const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { orderId } = req.params
    const { reason } = req.body
    const userId = req.user.id

    const order = await Order.findOne({
      where: {
        id: orderId,
        [Op.or]: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "seller",
          attributes: ["id", "name", "email"],
        },
      ],
      transaction,
    })

    if (!order) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    if (order.status === "completed" || order.status === "cancelled") {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this order",
      })
    }

    if (order.escrowReleased) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order after payment has been released",
      })
    }

    // Update order status
    order.status = "cancelled"
    order.notes = reason || "Order cancelled"
    await order.save({ transaction })

    // Refund buyer if payment was held in escrow
    if (!order.escrowReleased) {
      const buyerWallet = await Wallet.findOne({
        where: { userId: order.buyerId },
        transaction,
      })

      if (buyerWallet) {
        buyerWallet.balance += Number.parseFloat(order.totalAmount)
        await buyerWallet.save({ transaction })

        // Create refund transaction
        await Transaction.create(
          {
            userId: order.buyerId,
            type: "refund",
            amount: Number.parseFloat(order.totalAmount),
            description: `Refund for cancelled order ${order.orderNumber}`,
            status: "completed",
            reference: `refund_${order.orderNumber}`,
            orderId: order.id,
          },
          { transaction },
        )
      }
    }

    await transaction.commit()

    // Send notifications
    try {
      const cancelledBy = userId === order.buyerId ? "buyer" : "seller"
      const otherParty = userId === order.buyerId ? order.seller : order.buyer
      const otherPartyId = userId === order.buyerId ? order.sellerId : order.buyerId

      // Email to other party
      const emailData = emailTemplates.orderCancelled(
        otherParty.name,
        order.orderNumber,
        cancelledBy,
        reason || "No reason provided",
        `${process.env.FRONTEND_URL}/orders/${order.id}`,
      )
      await sendEmail({
        to: otherParty.email,
        ...emailData,
      })

      // Telegram notification
      await sendTelegramMessage(
        otherPartyId,
        `❌ Order Cancelled\n\nOrder: ${order.orderNumber}\nCancelled by: ${cancelledBy}\nReason: ${reason || "No reason provided"}\n\nView order: ${process.env.FRONTEND_URL}/orders/${order.id}`,
      )
    } catch (notificationError) {
      console.error("Error sending cancellation notifications:", notificationError)
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    })
  } catch (error) {
    await transaction.rollback()
    console.error("Error cancelling order:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    })
  }
}

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderDetails,
  updateDeliveryStatus,
  confirmDelivery,
  cancelOrder,
}
