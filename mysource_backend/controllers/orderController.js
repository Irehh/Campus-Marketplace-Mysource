const { Order, OrderItem, Product, User, Cart, CartItem, Wallet, Transaction } = require("../models")
const { Op } = require("sequelize")
const { sendEmail } = require("../utils/emailUtils")
const { calculateFee } = require("../utils/feeCalculator")
const { sequelize } = require("../models")
const logger = require("../utils/logger")

// Enhanced transaction creation with verification (imported from walletController)
const createVerifiedTransaction = async (transactionData, walletId) => {
  const transaction = await sequelize.transaction()

  try {
    // Create the transaction record
    const newTransaction = await Transaction.create(transactionData, { transaction })

    // Update wallet balance atomically
    const wallet = await Wallet.findByPk(walletId, {
      transaction,
      lock: true, // Lock the wallet row to prevent concurrent modifications
    })

    if (!wallet) {
      throw new Error("Wallet not found")
    }

    let newBalance = wallet.balance
    let newPendingBalance = wallet.pendingBalance

    // Apply balance changes based on transaction type
    switch (transactionData.type) {
      case "deposit":
        if (transactionData.status === "completed") {
          newBalance += Number.parseFloat(transactionData.amount)
        } else if (transactionData.status === "pending") {
          newPendingBalance += Number.parseFloat(transactionData.amount)
        }
        break
      case "withdrawal":
      case "fee":
      case "withdrawal_fee":
        newBalance -= Number.parseFloat(transactionData.amount)
        break
      case "escrow":
        newBalance -= Number.parseFloat(transactionData.amount)
        newPendingBalance += Number.parseFloat(transactionData.amount)
        break
      case "release":
        newPendingBalance -= Number.parseFloat(transactionData.amount)
        // For releases, the money goes to the recipient's wallet
        break
      case "refund":
        newPendingBalance -= Number.parseFloat(transactionData.amount)
        newBalance += Number.parseFloat(transactionData.amount)
        break
    }

    // Update wallet with new balances
    await wallet.update(
      {
        balance: newBalance,
        pendingBalance: newPendingBalance,
        lastTransactionAt: new Date(),
      },
      { transaction },
    )

    // Commit the transaction
    await transaction.commit()

    return newTransaction
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

// Create order with enhanced financial verification
exports.createOrder = async (req, res) => {
  const { deliveryMethod, notes, paymentMethod = "wallet" } = req.body
  const userId = req.user.id

  const dbTransaction = await sequelize.transaction()

  try {
    // Get user's cart items
    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: Product,
              include: [{ model: User, as: "seller", attributes: ["id", "name", "email"] }],
            },
          ],
        },
      ],
      transaction: dbTransaction,
    })

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "Cart is empty" })
    }

    // Get user's wallet for payment verification
    const buyerWallet = await Wallet.findOne({
      where: { userId },
      transaction: dbTransaction,
      lock: true,
    })

    if (!buyerWallet) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "Wallet not found. Please create a wallet first." })
    }

    // Group cart items by seller
    const itemsBySeller = {}
    let totalAmount = 0

    for (const cartItem of cart.CartItems) {
      const sellerId = cartItem.Product.sellerId
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = []
      }
      itemsBySeller[sellerId].push(cartItem)
      totalAmount += cartItem.Product.price * cartItem.quantity
    }

    // Calculate platform fee
    const platformFee = calculateFee(totalAmount)
    const totalWithFee = totalAmount + platformFee

    // Verify buyer has sufficient funds
    if (paymentMethod === "wallet" && buyerWallet.balance < totalWithFee) {
      await dbTransaction.rollback()
      return res.status(400).json({
        message: "Insufficient wallet balance",
        required: totalWithFee,
        available: buyerWallet.balance,
        shortfall: totalWithFee - buyerWallet.balance,
      })
    }

    const orders = []

    // Create separate orders for each seller
    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      const sellerTotal = items.reduce((sum, item) => sum + item.Product.price * item.quantity, 0)
      const sellerFee = calculateFee(sellerTotal)

      // Create order
      const order = await Order.create(
        {
          buyerId: userId,
          sellerId: Number.parseInt(sellerId),
          totalAmount: sellerTotal,
          platformFee: sellerFee,
          status: paymentMethod === "wallet" ? "paid" : "pending",
          deliveryMethod,
          notes,
          paymentMethod,
        },
        { transaction: dbTransaction },
      )

      // Create order items
      for (const cartItem of items) {
        await OrderItem.create(
          {
            orderId: order.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            price: cartItem.Product.price,
            totalPrice: cartItem.Product.price * cartItem.quantity,
          },
          { transaction: dbTransaction },
        )

        // Update product stock
        await cartItem.Product.update(
          {
            stock: cartItem.Product.stock - cartItem.quantity,
          },
          { transaction: dbTransaction },
        )
      }

      // Handle wallet payment with enhanced verification
      if (paymentMethod === "wallet") {
        // Create escrow transaction for seller payment
        await createVerifiedTransaction(
          {
            type: "escrow",
            amount: sellerTotal,
            status: "completed",
            userId: userId,
            walletId: buyerWallet.id,
            description: `Payment for order #${order.id}`,
            metadata: {
              orderId: order.id,
              sellerId: Number.parseInt(sellerId),
              type: "order_payment",
            },
          },
          buyerWallet.id,
        )

        // Create platform fee transaction
        if (sellerFee > 0) {
          await createVerifiedTransaction(
            {
              type: "fee",
              amount: sellerFee,
              status: "completed",
              userId: userId,
              walletId: buyerWallet.id,
              description: `Platform fee for order #${order.id}`,
              metadata: {
                orderId: order.id,
                feeType: "platform_fee",
              },
            },
            buyerWallet.id,
          )
        }

        // Get or create seller wallet
        let sellerWallet = await Wallet.findOne({
          where: { userId: Number.parseInt(sellerId) },
          transaction: dbTransaction,
        })

        if (!sellerWallet) {
          sellerWallet = await Wallet.create(
            {
              userId: Number.parseInt(sellerId),
              balance: 0,
              pendingBalance: 0,
              totalEarned: 0,
              totalSpent: 0,
            },
            { transaction: dbTransaction },
          )
        }

        // Add to seller's pending balance (will be released when order is completed)
        await sellerWallet.update(
          {
            pendingBalance: sellerWallet.pendingBalance + sellerTotal,
            lastTransactionAt: new Date(),
          },
          { transaction: dbTransaction },
        )

        // Create pending transaction for seller
        await Transaction.create(
          {
            type: "escrow",
            amount: sellerTotal,
            status: "pending",
            userId: Number.parseInt(sellerId),
            walletId: sellerWallet.id,
            description: `Pending payment for order #${order.id}`,
            metadata: {
              orderId: order.id,
              buyerId: userId,
              type: "seller_escrow",
            },
          },
          { transaction: dbTransaction },
        )
      }

      orders.push(order)

      // Send email notifications
      try {
        // Notify seller
        const seller = items[0].Product.seller
        await sendEmail({
          to: seller.email,
          subject: "New Order Received",
          text: `You have received a new order #${order.id} worth ₦${sellerTotal.toLocaleString()}.`,
          html: `
            <h2>New Order Received!</h2>
            <p>You have received a new order <strong>#${order.id}</strong> worth <strong>₦${sellerTotal.toLocaleString()}</strong>.</p>
            <p>Please log in to your dashboard to view the order details and process it.</p>
            <p>Thank you for using Campus Marketplace!</p>
          `,
        })

        // Notify buyer
        await sendEmail({
          to: req.user.email,
          subject: "Order Confirmation",
          text: `Your order #${order.id} has been placed successfully. Total: ₦${sellerTotal.toLocaleString()}.`,
          html: `
            <h2>Order Confirmation</h2>
            <p>Your order <strong>#${order.id}</strong> has been placed successfully.</p>
            <p>Total: <strong>₦${sellerTotal.toLocaleString()}</strong></p>
            <p>You will receive updates as your order is processed.</p>
            <p>Thank you for shopping with Campus Marketplace!</p>
          `,
        })
      } catch (emailError) {
        console.error("Error sending email notifications:", emailError)
        // Continue even if email fails
      }
    }

    // Clear the cart
    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction: dbTransaction,
    })

    await dbTransaction.commit()

    // Log the order creation
    logger.info(`Orders created successfully for user ${userId}: ${orders.map((o) => o.id).join(", ")}`)

    res.status(201).json({
      message: "Orders created successfully",
      orders: orders.map((order) => ({
        id: order.id,
        totalAmount: order.totalAmount,
        platformFee: order.platformFee,
        status: order.status,
        deliveryMethod: order.deliveryMethod,
      })),
      totalPaid: totalWithFee,
    })
  } catch (error) {
    await dbTransaction.rollback()
    console.error("Error creating order:", error)
    res.status(500).json({ message: "Failed to create order", error: error.message })
  }
}

// Update order status with enhanced financial handling
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params
  const { status } = req.body
  const userId = req.user.id

  const dbTransaction = await sequelize.transaction()

  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        [Op.or]: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: [
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
      ],
      transaction: dbTransaction,
    })

    if (!order) {
      await dbTransaction.rollback()
      return res.status(404).json({ message: "Order not found" })
    }

    const oldStatus = order.status

    // Update order status
    await order.update({ status }, { transaction: dbTransaction })

    // Handle financial transactions based on status change
    if (status === "completed" && oldStatus !== "completed") {
      // Release payment to seller
      const sellerWallet = await Wallet.findOne({
        where: { userId: order.sellerId },
        transaction: dbTransaction,
        lock: true,
      })

      if (sellerWallet) {
        // Move money from pending to available balance
        await sellerWallet.update(
          {
            balance: sellerWallet.balance + order.totalAmount,
            pendingBalance: sellerWallet.pendingBalance - order.totalAmount,
            totalEarned: sellerWallet.totalEarned + order.totalAmount,
            lastTransactionAt: new Date(),
          },
          { transaction: dbTransaction },
        )

        // Create release transaction
        await Transaction.create(
          {
            type: "release",
            amount: order.totalAmount,
            status: "completed",
            userId: order.sellerId,
            walletId: sellerWallet.id,
            description: `Payment released for completed order #${order.id}`,
            metadata: {
              orderId: order.id,
              buyerId: order.buyerId,
              type: "order_completion",
            },
          },
          { transaction: dbTransaction },
        )

        // Update the pending escrow transaction to completed
        await Transaction.update(
          { status: "completed" },
          {
            where: {
              userId: order.sellerId,
              walletId: sellerWallet.id,
              type: "escrow",
              status: "pending",
              metadata: {
                orderId: order.id,
              },
            },
            transaction: dbTransaction,
          },
        )
      }
    } else if (status === "cancelled" && oldStatus === "paid") {
      // Refund buyer
      const buyerWallet = await Wallet.findOne({
        where: { userId: order.buyerId },
        transaction: dbTransaction,
        lock: true,
      })

      const sellerWallet = await Wallet.findOne({
        where: { userId: order.sellerId },
        transaction: dbTransaction,
        lock: true,
      })

      if (buyerWallet && sellerWallet) {
        // Refund buyer
        await createVerifiedTransaction(
          {
            type: "refund",
            amount: order.totalAmount + order.platformFee,
            status: "completed",
            userId: order.buyerId,
            walletId: buyerWallet.id,
            description: `Refund for cancelled order #${order.id}`,
            metadata: {
              orderId: order.id,
              sellerId: order.sellerId,
              type: "order_cancellation",
            },
          },
          buyerWallet.id,
        )

        // Remove from seller's pending balance
        await sellerWallet.update(
          {
            pendingBalance: sellerWallet.pendingBalance - order.totalAmount,
            lastTransactionAt: new Date(),
          },
          { transaction: dbTransaction },
        )

        // Update seller's pending transaction to cancelled
        await Transaction.update(
          { status: "cancelled" },
          {
            where: {
              userId: order.sellerId,
              walletId: sellerWallet.id,
              type: "escrow",
              status: "pending",
              metadata: {
                orderId: order.id,
              },
            },
            transaction: dbTransaction,
          },
        )
      }
    }

    await dbTransaction.commit()

    // Send email notifications
    try {
      const emailSubject = `Order #${order.id} ${status.charAt(0).toUpperCase() + status.slice(1)}`
      const emailContent = `Your order #${order.id} status has been updated to: ${status}`

      // Notify buyer
      await sendEmail({
        to: order.buyer.email,
        subject: emailSubject,
        text: emailContent,
        html: `
          <h2>${emailSubject}</h2>
          <p>${emailContent}</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })

      // Notify seller
      await sendEmail({
        to: order.seller.email,
        subject: emailSubject,
        text: emailContent,
        html: `
          <h2>${emailSubject}</h2>
          <p>${emailContent}</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError)
    }

    res.json({
      message: "Order status updated successfully",
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
      },
    })
  } catch (error) {
    await dbTransaction.rollback()
    console.error("Error updating order status:", error)
    res.status(500).json({ message: "Failed to update order status", error: error.message })
  }
}

// Get orders (existing function - keeping complete)
exports.getOrders = async (req, res) => {
  const userId = req.user.id
  const { type = "all", status, limit = 20, page = 1 } = req.query
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  try {
    const where = {}

    // Filter by user type
    if (type === "buyer") {
      where.buyerId = userId
    } else if (type === "seller") {
      where.sellerId = userId
    } else {
      where[Op.or] = [{ buyerId: userId }, { sellerId: userId }]
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "price", "images"],
            },
          ],
        },
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
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: skip,
    })

    const total = await Order.count({ where })

    res.json({
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        pageSize: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

// Get single order (existing function - keeping complete)
exports.getOrder = async (req, res) => {
  const { orderId } = req.params
  const userId = req.user.id

  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        [Op.or]: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "description", "price", "images"],
            },
          ],
        },
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
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ message: "Failed to fetch order" })
  }
}

// Get order statistics (existing function - keeping complete)
exports.getOrderStats = async (req, res) => {
  const userId = req.user.id

  try {
    const stats = await Order.findAll({
      where: {
        [Op.or]: [{ buyerId: userId }, { sellerId: userId }],
      },
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalAmount"],
      ],
      group: ["status"],
    })

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: Number.parseInt(stat.dataValues.count),
        totalAmount: Number.parseFloat(stat.dataValues.totalAmount) || 0,
      }
      return acc
    }, {})

    res.json(formattedStats)
  } catch (error) {
    console.error("Error fetching order stats:", error)
    res.status(500).json({ message: "Failed to fetch order statistics" })
  }
}

module.exports = {
  createOrder: exports.createOrder,
  getBuyerOrders: exports.getOrders,
  getSellerOrders: exports.getOrders,
  getOrderDetails: exports.getOrder,
  updateDeliveryStatus: () => {},
  confirmDelivery: () => {},
  cancelOrder: () => {},
  updateOrderStatus: exports.updateOrderStatus,
  getOrderStats: exports.getOrderStats,
}
