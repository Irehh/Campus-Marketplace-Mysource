const { Order, OrderItem, Product, User, Cart, CartItem, Wallet, Transaction, Image } = require("../models");
const { Op } = require("sequelize");
const { sendEmail } = require("../utils/emailUtils");
const { calculatePlatformFee } = require("../utils/feeCalculator");
const { sequelize } = require("../models");
const logger = require("../utils/logger");
const { createVerifiedTransaction } = require("./walletController");

exports.createOrder = async (req, res) => {
  const { deliveryMethod, notes } = req.body;
  const userId = req.user.id;

  const dbTransaction = await sequelize.transaction();

  try {
    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: Product,
              include: [
                { model: User, as: "seller", attributes: ["id", "name", "email"] },
                { model: Image, attributes: ["id", "url"], limit: 1 },
              ],
            },
          ],
        },
      ],
      transaction: dbTransaction,
    });

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Cart is empty" });
    }

    const buyerWallet = await Wallet.findOne({
      where: { userId },
      transaction: dbTransaction,
      lock: true,
    });

    if (!buyerWallet) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Wallet not found. Please create a wallet first." });
    }

    const itemsBySeller = {};
    let totalAmount = 0;

    for (const cartItem of cart.CartItems) {
      if (!cartItem.Product || !cartItem.Product.platformPurchaseEnabled || cartItem.Product.isDisabled) {
        await dbTransaction.rollback();
        return res.status(400).json({ message: `Product ${cartItem.productId} is not available for purchase.` });
      }
      const sellerId = cartItem.Product.sellerId;
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(cartItem);
      totalAmount += Number.parseFloat(cartItem.price) * cartItem.quantity;
    }

    const platformFee = calculateFee(totalAmount);
    const totalWithFee = totalAmount + platformFee;

    if (buyerWallet.balance < totalWithFee) {
      await dbTransaction.rollback();
      return res.status(400).json({
        message: "Insufficient wallet balance",
        required: totalWithFee,
        available: buyerWallet.balance,
        shortfall: totalWithFee - buyerWallet.balance,
      });
    }

    const orders = [];

    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      const sellerTotal = items.reduce((sum, item) => sum + Number.parseFloat(item.price) * item.quantity, 0);
      const sellerFee = calculateFee(sellerTotal);
      const orderNumber = Order.generateOrderNumber();

      const order = await Order.create(
        {
          orderNumber,
          buyerId: userId,
          sellerId: Number.parseInt(sellerId),
          totalAmount: sellerTotal,
          subtotal: sellerTotal,
          platformFee: sellerFee,
          status: "confirmed",
          deliveryMethod,
          notes,
          campus: req.user.campus || cart.CartItems[0].Product.campus,
        },
        { transaction: dbTransaction }
      );

      for (const cartItem of items) {
        await OrderItem.create(
          {
            orderId: order.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            price: Number.parseFloat(cartItem.price),
            productSnapshot: {
              title: cartItem.Product.description,
              price: cartItem.Product.price,
              category: cartItem.Product.category,
              images: cartItem.Product.Images?.map((img) => ({ id: img.id, url: img.url })) || [],
            },
          },
          { transaction: dbTransaction }
        );
      }

      await createVerifiedTransaction(
        {
          type: "escrow",
          amount: sellerTotal,
          status: "completed",
          userId: userId,
          walletId: buyerWallet.id,
          description: `Payment for order #${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            sellerId: Number.parseInt(sellerId),
            type: "order_payment",
          },
        },
        buyerWallet.id,
        { transaction: dbTransaction }
      );

      if (sellerFee > 0) {
        await createVerifiedTransaction(
          {
            type: "fee",
            amount: sellerFee,
            status: "completed",
            userId: userId,
            walletId: buyerWallet.id,
            description: `Platform fee for order #${order.orderNumber}`,
            metadata: {
              orderId: order.id,
              feeType: "platform_fee",
            },
          },
          buyerWallet.id,
          { transaction: dbTransaction }
        );
      }

      let sellerWallet = await Wallet.findOne({
        where: { userId: Number.parseInt(sellerId) },
        transaction: dbTransaction,
      });

      if (!sellerWallet) {
        sellerWallet = await Wallet.create(
          {
            userId: Number.parseInt(sellerId),
            balance: 0,
            pendingBalance: 0,
            totalEarned: 0,
            totalSpent: 0,
          },
          { transaction: dbTransaction }
        );
      }

      await sellerWallet.update(
        {
          pendingBalance: sellerWallet.pendingBalance + sellerTotal,
          lastTransactionAt: new Date(),
        },
        { transaction: dbTransaction }
      );

      await Transaction.create(
        {
          type: "escrow",
          amount: sellerTotal,
          status: "pending",
          userId: Number.parseInt(sellerId),
          walletId: sellerWallet.id,
          description: `Pending payment for order #${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            buyerId: userId,
            type: "seller_escrow",
          },
        },
        { transaction: dbTransaction }
      );

      orders.push(order);

      try {
        const seller = items[0].Product.seller;
        await sendEmail({
          to: seller.email,
          subject: `New Order Received #${order.orderNumber}`,
          text: `You have received a new order #${order.orderNumber} worth ₦${sellerTotal.toLocaleString()}.`,
          html: `
            <h2 style="color: #00b53f;">New Order Received!</h2>
            <p>You have received a new order <strong>#${order.orderNumber}</strong> worth <strong>₦${sellerTotal.toLocaleString()}</strong>.</p>
            <p>Please log in to your dashboard to view the order details and process it.</p>
            <p>Thank you for using Campus Marketplace!</p>
          `,
        });

        await sendEmail({
          to: req.user.email,
          subject: `Order Confirmation #${order.orderNumber}`,
          text: `Your order #${order.orderNumber} has been placed successfully. Total: ₦${(sellerTotal + sellerFee).toLocaleString()}.`,
          html: `
            <h2 style="color: #00b53f;">Order Confirmation</h2>
            <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
            <p>Subtotal: <strong>₦${sellerTotal.toLocaleString()}</strong></p>
            <p>Platform Fee: <strong>₦${sellerFee.toLocaleString()}</strong></p>
            <p>Total: <strong>₦${(sellerTotal + sellerFee).toLocaleString()}</strong></p>
            <p>You will receive updates as your order is processed.</p>
            <p>Thank you for shopping with Campus Marketplace!</p>
          `,
        });
      } catch (emailError) {
        logger.error("Error sending email notifications:", emailError);
      }
    }

    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction: dbTransaction,
    });

    await dbTransaction.commit();

    logger.info(`Orders created successfully for user ${userId}: ${orders.map((o) => o.orderNumber).join(", ")}`);

    res.status(201).json({
      message: "Orders created successfully",
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        platformFee: order.platformFee,
        status: order.status,
        deliveryMethod: order.deliveryMethod,
      })),
      totalPaid: totalWithFee,
    });
  } catch (error) {
    await dbTransaction.rollback();
    logger.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

exports.buyNow = async (req, res) => {
  const { productId, quantity = 1, deliveryMethod = "pickup", notes } = req.body;
  const userId = req.user.id;

  const dbTransaction = await sequelize.transaction();

  try {
    // Validate product
    const product = await Product.findOne({
      where: { id: productId, platformPurchaseEnabled: true, isDisabled: false },
      include: [
        { model: User, as: "User", attributes: ["id", "name", "email"] },
        { model: Image, attributes: ["id", "url"], limit: 1 },
      ],
      transaction: dbTransaction,
    });

    if (!product) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Product not found or not available for purchase" });
    }

    if (product.userId === userId) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "You cannot purchase your own product" });
    }

    // Get or create cart
    let cart = await Cart.findOne({
      where: { userId },
      include: [{ model: CartItem, where: { productId }, required: false }],
      transaction: dbTransaction,
    });

    if (!cart) {
      cart = await Cart.create({ userId }, { transaction: dbTransaction });
    }

    cart.CartItems = cart.CartItems || [];
    // Add or update cart item
    const existingCartItem = cart.CartItems.find((item) => item.productId === productId);
    if (existingCartItem) {
      await existingCartItem.update(
        { quantity: existingCartItem.quantity + quantity, price: product.price },
        { transaction: dbTransaction }
      );
    } else {
      await CartItem.create(
        {
          cartId: cart.id,
          productId: productId,
          quantity,
          price: product.price,
        },
        { transaction: dbTransaction }
      );
    }

    // Validate wallet balance
    const buyerWallet = await Wallet.findOne({
      where: { userId },
      transaction: dbTransaction,
      lock: true,
    });

    if (!buyerWallet) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Wallet not found. Please create a wallet first." });
    }

    const totalAmount = Number.parseFloat(product.price) * quantity;
    const platformFee = calculatePlatformFee(totalAmount);
    const totalWithFee = totalAmount + platformFee;

    if (buyerWallet.balance < totalWithFee) {
      await dbTransaction.rollback();
      return res.status(400).json({
        message: "Insufficient wallet balance",
        required: totalWithFee,
        available: buyerWallet.balance,
        shortfall: totalWithFee - buyerWallet.balance,
      });
    }

    // Create order
    const orderNumber = Order.generateOrderNumber();
    const order = await Order.create(
      {
        orderNumber,
        buyerId: userId,
        sellerId: product.userId,
        totalAmount,
        subtotal: totalAmount,
        platformFee,
        status: "confirmed",
        deliveryMethod,
        notes,
        campus: product.campus,
      },
      { transaction: dbTransaction }
    );

    // Create order item
    await OrderItem.create(
      {
        orderId: order.id,
        productId: productId,
        quantity,
        price: Number.parseFloat(product.price),
        productSnapshot: {
          title: product.description,
          price: product.price,
          category: product.category,
          images: product.Images?.map((img) => ({ id: img.id, url: img.url })) || [],
        },
      },
      { transaction: dbTransaction }
    );

    // Process wallet transactions
    await createVerifiedTransaction(
      {
        type: "escrow",
        amount: totalAmount,
        status: "completed",
        userId,
        walletId: buyerWallet.id,
        description: `Payment for order #${order.orderNumber}`,
        metadata: {
          orderId: order.id,
          sellerId: product.userId,
          type: "order_payment",
        },
      },
      buyerWallet.id,
      { transaction: dbTransaction }
    );

    if (platformFee > 0) {
      await createVerifiedTransaction(
        {
          type: "fee",
          amount: platformFee,
          status: "completed",
          userId,
          walletId: buyerWallet.id,
          description: `Platform fee for order #${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            feeType: "platform_fee",
          },
        },
        buyerWallet.id,
        { transaction: dbTransaction }
      );
    }

    // Update seller wallet
    let sellerWallet = await Wallet.findOne({
      where: { userId: product.userId },
      transaction: dbTransaction,
    });

    if (!sellerWallet) {
      sellerWallet = await Wallet.create(
        {
          userId: product.sellerId,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
        { transaction: dbTransaction }
      );
    }

    await sellerWallet.update(
      {
        pendingBalance: sellerWallet.pendingBalance + totalAmount,
        lastTransactionAt: new Date(),
      },
      { transaction: dbTransaction }
    );

    await Transaction.create(
      {
        type: "escrow",
        amount: totalAmount,
        status: "pending",
        userId: product.userId,
        walletId: sellerWallet.id,
        description: `Pending payment for order #${order.orderNumber}`,
        metadata: {
          orderId: order.id,
          buyerId: userId,
          type: "seller_escrow",
        },
      },
      { transaction: dbTransaction }
    );

    // Clear cart item
    await CartItem.destroy({
      where: { cartId: cart.id, productId },
      transaction: dbTransaction,
    });

    await dbTransaction.commit();

    // Send email notifications
    try {
      await sendEmail({
        to: product.seller.email,
        subject: `New Order Received #${order.orderNumber}`,
        text: `You have received a new order #${order.orderNumber} worth ₦${totalAmount.toLocaleString()}.`,
        html: `
          <h2 style="color: #00b53f;">New Order Received!</h2>
          <p>You have received a new order <strong>#${order.orderNumber}</strong> worth <strong>₦${totalAmount.toLocaleString()}</strong>.</p>
          <p>Please log in to your dashboard to view the order details and process it.</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      });

      await sendEmail({
        to: user.email,
        subject: `Order Confirmation #${order.orderNumber}`,
        text: `Your order #${order.orderNumber} has been placed successfully. Total: ₦${totalWithFee.toLocaleString()}.`,
        html: `
          <h2 style="color: #00b53f;">Order Confirmation</h2>
          <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
          <p>Subtotal: <strong>₦${totalAmount.toLocaleString()}</strong></p>
          <p>Platform Fee: <strong>₦${platformFee.toLocaleString()}</strong></p>
          <p>Total: <strong>₦${totalWithFee.toLocaleString()}</strong></p>
          <p>You will receive updates as your order is processed.</p>
          <p>Thank you for shopping with Campus Marketplace!</p>
        `,
      });
    } catch (emailError) {
      logger.error("Error sending email notifications:", emailError);
    }

    logger.info(`Buy Now order created successfully for user ${userId}: ${order.orderNumber}`);

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount,
        platformFee,
        status: order.status,
        deliveryMethod,
      },
      totalPaid: totalWithFee,
    });
  } catch (error) {
    await dbTransaction.rollback();
    logger.error("Error in buy now:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  const dbTransaction = await sequelize.transaction();

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
    });

    if (!order) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "completed", "cancelled", "disputed"];
    if (!validStatuses.includes(status)) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Invalid status" });
    }

    const oldStatus = order.status;

    await order.update({ status }, { transaction: dbTransaction });

    if (status === "completed" && oldStatus !== "completed") {
      const sellerWallet = await Wallet.findOne({
        where: { userId: order.sellerId },
        transaction: dbTransaction,
        lock: true,
      });

      if (sellerWallet) {
        await sellerWallet.update(
          {
            balance: sellerWallet.balance + order.totalAmount,
            pendingBalance: sellerWallet.pendingBalance - order.totalAmount,
            totalEarned: sellerWallet.totalEarned + order.totalAmount,
            lastTransactionAt: new Date(),
          },
          { transaction: dbTransaction }
        );

        await createVerifiedTransaction(
          {
            type: "release",
            amount: order.totalAmount,
            status: "completed",
            userId: order.sellerId,
            walletId: sellerWallet.id,
            description: `Payment released for completed order #${order.orderNumber}`,
            metadata: {
              orderId: order.id,
              buyerId: order.buyerId,
              type: "order_completion",
            },
          },
          sellerWallet.id,
          { transaction: dbTransaction }
        );

        await Transaction.update(
          { status: "completed" },
          {
            where: {
              userId: order.sellerId,
              walletId: sellerWallet.id,
              type: "escrow",
              status: "pending",
              "metadata.orderId": order.id,
            },
            transaction: dbTransaction,
          }
        );

        await order.update(
          {
            escrowReleased: true,
            escrowReleasedAt: new Date(),
          },
          { transaction: dbTransaction }
        );
      }
    } else if (status === "cancelled" && oldStatus !== "cancelled" && oldStatus !== "completed") {
      const buyerWallet = await Wallet.findOne({
        where: { userId: order.buyerId },
        transaction: dbTransaction,
        lock: true,
      });

      const sellerWallet = await Wallet.findOne({
        where: { userId: order.sellerId },
        transaction: dbTransaction,
        lock: true,
      });

      if (buyerWallet && sellerWallet) {
        await createVerifiedTransaction(
          {
            type: "refund",
            amount: order.totalAmount + order.platformFee,
            status: "completed",
            userId: order.buyerId,
            walletId: buyerWallet.id,
            description: `Refund for cancelled order #${order.orderNumber}`,
            metadata: {
              orderId: order.id,
              sellerId: order.sellerId,
              type: "order_cancellation",
            },
          },
          buyerWallet.id,
          { transaction: dbTransaction }
        );

        await sellerWallet.update(
          {
            pendingBalance: sellerWallet.pendingBalance - order.totalAmount,
            lastTransactionAt: new Date(),
          },
          { transaction: dbTransaction }
        );

        await Transaction.update(
          { status: "cancelled" },
          {
            where: {
              userId: order.sellerId,
              walletId: sellerWallet.id,
              type: "escrow",
              status: "pending",
              "metadata.orderId": order.id,
            },
            transaction: dbTransaction,
          }
        );
      }
    }

    await dbTransaction.commit();

    try {
      const emailSubject = `Order #${order.orderNumber} ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const emailContent = `Your order #${order.orderNumber} status has been updated to: ${status}`;

      await sendEmail({
        to: order.buyer.email,
        subject: emailSubject,
        text: emailContent,
        html: `
          <h2 style="color: #00b53f;">${emailSubject}</h2>
          <p>${emailContent}</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      });

      await sendEmail({
        to: order.seller.email,
        subject: emailSubject,
        text: emailContent,
        html: `
          <h2 style="color: #00b53f;">${emailSubject}</h2>
          <p>${emailContent}</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      });
    } catch (emailError) {
      logger.error("Error sending email notifications:", emailError);
    }

    res.json({
      message: "Order status updated successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
      },
    });
  } catch (error) {
    await dbTransaction.rollback();
    logger.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

// exports.getOrders = async (req, res) => {
//   const userId = req.user.id;
//   const { type = options.type || "all", status, limit = 20, page = 1 } = req.query;
//   const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

//   try {
//     const where = {};

//     if (type === "buyer") {
//       where.buyerId = userId;
//     } else if (type === "seller") {
//       where.sellerId = userId;
//     } else {
//       where[Op.or] = [{ buyerId: userId }, { sellerId: userId }];
//     }

//     if (status) {
//       where.status = status;
//     }

//     const orders = await Order.findAll({
//       where,
//       include: [
//         {
//           model: OrderItem,
//           include: [
//             {
//               model: Product,
//               attributes: ["id", "description", "price", "category"],
//               include: [{ model: Image, attributes: ["id", "url"], limit: 1 }],
//             },
//           ],
//         },
//         {
//           model: User,
//           as: "buyer",
//           attributes: ["id", "name", "email"],
//         },
//         {
//           model: User,
//           as: "seller",
//           attributes: ["id", "name", "email"],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//       limit: Number.parseInt(limit),
//       offset: skip,
//     });

//     const total = await Order.count({ where });

//     res.json({
//       orders: orders.map((order) => ({
//         ...order.toJSON(),
//         orderItems: order.OrderItems.map((item) => ({
//           ...item.toJSON(),
//           totalPrice: Number.parseFloat(item.price) * item.quantity,
//         })),
//       })),
//       pagination: {
//         total,
//         page: Number.parseInt(page),
//         pageSize: Number.parseInt(limit),
//         totalPages: Math.ceil(total / Number.parseInt(limit)),
//       },
//     });
//   } catch (error) {
//     logger.error("Error fetching orders:", error);
//     res.status(500).json({ message: "Failed to fetch orders", error: error.message });
//   }
// };

exports.getOrders = async (req, res, options = {}) => {
  const userId = req.user.id;
  const { type = options.type || "all", status, limit = 20, page = 1 } = req.query;
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

  try {
    const where = {};

    if (type === "buyer") {
      where.buyerId = userId;
    } else if (type === "seller") {
      where.sellerId = userId;
    } else {
      where[Op.or] = [{ buyerId: userId }, { sellerId: userId }];
    }

    if (status) {
      where.status = status;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "description", "price", "category"],
              include: [{ model: Image, attributes: ["id", "url"], limit: 1 }],
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
    });

    const total = await Order.count({ where });

    res.json({
      orders: orders.map((order) => ({
        ...order.toJSON(),
        orderItems: order.OrderItems.map((item) => ({
          ...item.toJSON(),
          totalPrice: Number.parseFloat(item.price) * item.quantity,
        })),
      })),
      pagination: {
        total,
        page: Number.parseInt(page),
        pageSize: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};


exports.getOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

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
              attributes: ["id", "description", "price", "category"],
              include: [{ model: Image, attributes: ["id", "url"], limit: 1 }],
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
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      ...order.toJSON(),
      orderItems: order.OrderItems.map((item) => ({
        ...item.toJSON(),
        totalPrice: Number.parseFloat(item.price) * item.quantity,
      })),
    });
  } catch (error) {
    logger.error("Error fetching order:", error);
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
};

exports.getOrderStats = async (req, res) => {
  const userId = req.user.id;

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
    });

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: Number.parseInt(stat.dataValues.count),
        totalAmount: Number.parseFloat(stat.dataValues.totalAmount) || 0,
      };
      return acc;
    }, {});

    res.json(formattedStats);
  } catch (error) {
    logger.error("Error fetching order stats:", error);
    res.status(500).json({ message: "Failed to fetch order statistics", error: error.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const dbTransaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        buyerId: userId,
        deliveryStatus: "delivered",
        status: { [Op.notIn]: ["completed", "cancelled", "disputed"] },
      },
      include: [
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
      ],
      transaction: dbTransaction,
    });

    if (!order) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Order not found or not eligible for confirmation" });
    }

    await order.update(
      {
        deliveryStatus: "confirmed_by_buyer",
        buyerConfirmedAt: new Date(),
        status: "completed",
      },
      { transaction: dbTransaction }
    );

    const sellerWallet = await Wallet.findOne({
      where: { userId: order.sellerId },
      transaction: dbTransaction,
      lock: true,
    });

    if (sellerWallet) {
      await sellerWallet.update(
        {
          balance: sellerWallet.balance + order.totalAmount,
          pendingBalance: sellerWallet.pendingBalance - order.totalAmount,
          totalEarned: sellerWallet.totalEarned + order.totalAmount,
          lastTransactionAt: new Date(),
        },
        { transaction: dbTransaction }
      );

      await createVerifiedTransaction(
        {
          type: "release",
          amount: order.totalAmount,
          status: "completed",
          userId: order.sellerId,
          walletId: sellerWallet.id,
          description: `Payment released for completed order #${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            buyerId: order.buyerId,
            type: "order_completion",
          },
        },
        sellerWallet.id,
        { transaction: dbTransaction }
      );

      await Transaction.update(
        { status: "completed" },
        {
          where: {
            userId: order.sellerId,
            walletId: sellerWallet.id,
            type: "escrow",
            status: "pending",
            "metadata.orderId": order.id,
          },
          transaction: dbTransaction,
        }
      );

      await order.update(
        {
          escrowReleased: true,
          escrowReleasedAt: new Date(),
        },
        { transaction: dbTransaction }
      );
    }

    await dbTransaction.commit();

    try {
      await sendEmail({
        to: order.buyer.email,
        subject: `Order #${order.orderNumber} Delivery Confirmed`,
        text: `You have confirmed delivery for order #${order.orderNumber}. The payment has been released to the seller.`,
        html: `
          <h2 style="color: #00b53f;">Delivery Confirmed</h2>
          <p>You have confirmed delivery for order <strong>#${order.orderNumber}</strong>.</p>
          <p>The payment has been released to the seller.</p>
          <p>Thank you for shopping with Campus Marketplace!</p>
        `,
      });

      await sendEmail({
        to: order.seller.email,
        subject: `Order #${order.orderNumber} Completed`,
        text: `The buyer has confirmed delivery for order #${order.orderNumber}. The payment of ₦${order.totalAmount.toLocaleString()} has been released to your wallet.`,
        html: `
          <h2 style="color: #00b53f;">Order Completed</h2>
          <p>The buyer has confirmed delivery for order <strong>#${order.orderNumber}</strong>.</p>
          <p>The payment of <strong>₦${order.totalAmount.toLocaleString()}</strong> has been released to your wallet.</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      });
    } catch (emailError) {
      logger.error("Error sending email notifications:", emailError);
    }

    res.json({
      message: "Delivery confirmed successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
      },
    });
  } catch (error) {
    await dbTransaction.rollback();
    logger.error("Error confirming delivery:", error);
    res.status(500).json({ message: "Failed to confirm delivery", error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const { reason } = req.body;

  const dbTransaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        buyerId: userId,
        status: { [Op.in]: ["pending", "confirmed"] },
      },
      include: [
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
      ],
      transaction: dbTransaction,
    });

    if (!order) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Order not found or cannot be cancelled" });
    }

    await order.update(
      {
        status: "cancelled",
        notes: reason ? `${order.notes || ""}\nCancellation reason: ${reason}` : order.notes,
      },
      { transaction: dbTransaction }
    );

    const buyerWallet = await Wallet.findOne({
      where: { userId: order.buyerId },
      transaction: dbTransaction,
      lock: true,
    });

    const sellerWallet = await Wallet.findOne({
      where: { userId: order.sellerId },
      transaction: dbTransaction,
      lock: true,
    });

    if (buyerWallet && sellerWallet) {
      await createVerifiedTransaction(
        {
          type: "refund",
          amount: order.totalAmount + order.platformFee,
          status: "completed",
          userId: order.buyerId,
          walletId: buyerWallet.id,
          description: `Refund for cancelled order #${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            sellerId: order.sellerId,
            type: "order_cancellation",
            reason,
          },
        },
        buyerWallet.id,
        { transaction: dbTransaction }
      );

      await sellerWallet.update(
        {
          pendingBalance: sellerWallet.pendingBalance - order.totalAmount,
          lastTransactionAt: new Date(),
        },
        { transaction: dbTransaction }
      );

      await Transaction.update(
        { status: "cancelled" },
        {
          where: {
            userId: order.sellerId,
            walletId: sellerWallet.id,
            type: "escrow",
            status: "pending",
            "metadata.orderId": order.id,
          },
          transaction: dbTransaction,
        }
      );
    }

    await dbTransaction.commit();

    try {
      await sendEmail({
        to: order.buyer.email,
        subject: `Order #${order.orderNumber} Cancelled`,
        text: `Your order #${order.orderNumber} has been cancelled. The full amount of ₦${(order.totalAmount + order.platformFee).toLocaleString()} has been refunded to your wallet.`,
        html: `
          <h2 style="color: #00b53f;">Order Cancelled</h2>
          <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
          <p>The full amount of <strong>₦${(order.totalAmount + order.platformFee).toLocaleString()}</strong> has been refunded to your wallet.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>Thank you for using Campus Marketplace!</p>
        `,
      });

      await sendEmail({
        to: order.seller.email,
        subject: `Order #${order.orderNumber} Cancelled`,
        text: `Order #${order.orderNumber} has been cancelled by the buyer. The payment has been refunded.`,
        html: `
          <h2 style="color: #00b53f;">Order Cancelled</h2>
          <p>Order <strong>#${order.orderNumber}</strong> has been cancelled by the buyer.</p>
          <p>The payment has been refunded to the buyer.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>Thank you for using Campus Marketplace!</p>
        `,
      });
    } catch (emailError) {
      logger.error("Error sending email notifications:", emailError);
    }

    res.json({
      message: "Order cancelled successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    await dbTransaction.rollback();
    logger.error("Error cancelling order:", error);
    res.status(500).json({ message: "Failed to cancel order", error: error.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  const { orderId } = req.params;
  const { deliveryStatus } = req.body;
  const userId = req.user.id;

  const dbTransaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        sellerId: userId,
        status: { [Op.notIn]: ["cancelled", "completed"] },
      },
      include: [
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
        { model: User, as: "seller", attributes: ["id", "name", "email"] },
      ],
      transaction: dbTransaction,
    });

    if (!order) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Order not found or not eligible for delivery status update" });
    }

    const validDeliveryStatuses = [
      "pending",
      "preparing",
      "ready_for_pickup",
      "in_transit",
      "delivered",
      "confirmed_by_buyer",
    ];
    if (!validDeliveryStatuses.includes(deliveryStatus)) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Invalid delivery status" });
    }

    const updates = { deliveryStatus };
    if (deliveryStatus === "delivered") {
      updates.deliveryConfirmedAt = new Date();
    }

    await order.update(updates, { transaction: dbTransaction });

    await dbTransaction.commit();

    try {
      await sendEmail({
        to: order.buyer.email,
        subject: `Order #${order.orderNumber} Delivery Status Updated`,
        text: `The delivery status for your order #${order.orderNumber} has been updated to: ${deliveryStatus}.`,
        html: `
          <h2 style="color: #00b53f;">Delivery Status Updated</h2>
          <p>The delivery status for your order <strong>#${order.orderNumber}</strong> has been updated to: <strong>${deliveryStatus}</strong>.</p>
          ${deliveryStatus === "delivered" ? "<p>Please confirm receipt of your order in your dashboard.</p>" : ""}
          <p>Thank you for shopping with Campus Marketplace!</p>
        `,
      });

      await sendEmail({
        to: order.seller.email,
        subject: `Order #${order.orderNumber} Delivery Status Updated`,
        text: `You have updated the delivery status for order #${order.orderNumber} to: ${deliveryStatus}.`,
        html: `
          <h2 style="color: #00b53f;">Delivery Status Updated</h2>
          <p>You have updated the delivery status for order <strong>#${order.orderNumber}</strong> to: <strong>${deliveryStatus}</strong>.</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      });
    } catch (emailError) {
      logger.error("Error sending email notifications:", emailError);
    }

    res.json({
      message: "Delivery status updated successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        deliveryStatus: order.deliveryStatus,
      },
    });
  } catch (error) {
    await dbTransaction.rollback();
    logger.error("Error updating delivery status:", error);
    res.status(500).json({ message: "Failed to update delivery status", error: error.message });
  }
};