const { Bid, Gig, User, Wallet, Transaction } = require("../models")
const { Op } = require("sequelize")
const { sendEmail } = require("../utils/emailUtils")
const { sequelize } = require("../models")
const logger = require("../utils/logger")

// Enhanced transaction creation with verification (same as in orderController)
const createVerifiedTransaction = async (transactionData, walletId) => {
  const transaction = await sequelize.transaction()

  try {
    // Create the transaction record
    const newTransaction = await Transaction.create(transactionData, { transaction })

    // Update wallet balance atomically
    const wallet = await Wallet.findByPk(walletId, {
      transaction,
      lock: true,
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

    await transaction.commit()
    return newTransaction
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

// Create bid with enhanced financial verification
exports.createBid = async (req, res) => {
  const { gigId, amount, proposal, deliveryTime } = req.body
  const userId = req.user.id

  const dbTransaction = await sequelize.transaction()

  try {
    // Validate required fields
    if (!gigId || !amount || !proposal || !deliveryTime) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if gig exists and is active
    const gig = await Gig.findOne({
      where: { id: gigId, status: "active" },
      include: [{ model: User, as: "client", attributes: ["id", "name", "email"] }],
      transaction: dbTransaction,
    })

    if (!gig) {
      await dbTransaction.rollback()
      return res.status(404).json({ message: "Gig not found or not active" })
    }

    // Check if user is trying to bid on their own gig
    if (gig.clientId === userId) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "You cannot bid on your own gig" })
    }

    // Check if user already has a bid on this gig
    const existingBid = await Bid.findOne({
      where: { gigId, freelancerId: userId },
      transaction: dbTransaction,
    })

    if (existingBid) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "You have already placed a bid on this gig" })
    }

    // Validate bid amount
    if (amount < 100) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "Minimum bid amount is ₦100" })
    }

    // Create the bid
    const bid = await Bid.create(
      {
        gigId,
        freelancerId: userId,
        amount: Number.parseFloat(amount),
        proposal,
        deliveryTime: Number.parseInt(deliveryTime),
        status: "pending",
      },
      { transaction: dbTransaction },
    )

    await dbTransaction.commit()

    // Send email notification to gig owner
    try {
      await sendEmail({
        to: gig.client.email,
        subject: "New Bid Received",
        text: `You have received a new bid of ₦${amount} on your gig "${gig.title}".`,
        html: `
          <h2>New Bid Received!</h2>
          <p>You have received a new bid of <strong>₦${amount.toLocaleString()}</strong> on your gig "<strong>${gig.title}</strong>".</p>
          <p><strong>Proposal:</strong> ${proposal}</p>
          <p><strong>Delivery Time:</strong> ${deliveryTime} days</p>
          <p>Please log in to your dashboard to review and respond to this bid.</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })
    } catch (emailError) {
      console.error("Error sending email notification:", emailError)
    }

    // Log the bid creation
    logger.info(`Bid created: ${bid.id} for gig ${gigId} by user ${userId}`)

    res.status(201).json({
      message: "Bid created successfully",
      bid: {
        id: bid.id,
        amount: bid.amount,
        proposal: bid.proposal,
        deliveryTime: bid.deliveryTime,
        status: bid.status,
      },
    })
  } catch (error) {
    await dbTransaction.rollback()
    console.error("Error creating bid:", error)
    res.status(500).json({ message: "Failed to create bid", error: error.message })
  }
}

// Get bids for a gig
exports.getBidsByGig = async (req, res) => {
  try {
    const { gigId } = req.params
    const { status, page = 1, limit = 10 } = req.query

    const offset = (page - 1) * limit

    // Check if the gig exists
    const gig = await Gig.findByPk(gigId)

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      })
    }

    // Check if the user is authorized to view the bids
    if (gig.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view these bids",
      })
    }

    // Build filter conditions
    const whereConditions = { gigId }

    if (status) whereConditions.status = status

    const { count, rows: bids } = await Bid.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "bidder",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number.parseInt(limit),
    })

    return res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: bids,
    })
  } catch (error) {
    logger.error(`Error fetching bids: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error fetching bids",
      error: error.message,
    })
  }
}

// Get bids by user
exports.getBidsByUser = async (req, res) => {
  try {
    const userId = req.user.id
    const { status, page = 1, limit = 10 } = req.query

    const offset = (page - 1) * limit

    // Build filter conditions
    const whereConditions = { userId }

    if (status) whereConditions.status = status

    const { count, rows: bids } = await Bid.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Gig,
          attributes: ["id", "title", "budget", "status", "campus"],
          include: [
            {
              model: User,
              as: "client",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: Number.parseInt(limit),
    })

    return res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: bids,
    })
  } catch (error) {
    logger.error(`Error fetching user bids: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error fetching user bids",
      error: error.message,
    })
  }
}

// Update a bid
exports.updateBid = async (req, res) => {
  const { bidId } = req.params
  const { amount, proposal, deliveryTime } = req.body
  const userId = req.user.id

  try {
    const bid = await Bid.findOne({
      where: { id: bidId, freelancerId: userId, status: "pending" },
    })

    if (!bid) {
      return res.status(404).json({ message: "Bid not found or cannot be updated" })
    }

    // Update bid
    await bid.update({
      amount: amount || bid.amount,
      proposal: proposal || bid.proposal,
      deliveryTime: deliveryTime || bid.deliveryTime,
    })

    res.json({
      message: "Bid updated successfully",
      bid: {
        id: bid.id,
        amount: bid.amount,
        proposal: bid.proposal,
        deliveryTime: bid.deliveryTime,
      },
    })
  } catch (error) {
    console.error("Error updating bid:", error)
    res.status(500).json({ message: "Failed to update bid" })
  }
}

// Withdraw a bid
exports.withdrawBid = async (req, res) => {
  const { bidId } = req.params
  const userId = req.user.id

  try {
    const bid = await Bid.findOne({
      where: { id: bidId, freelancerId: userId, status: "pending" },
    })

    if (!bid) {
      return res.status(404).json({ message: "Bid not found or cannot be deleted" })
    }

    await bid.destroy()

    res.json({ message: "Bid deleted successfully" })
  } catch (error) {
    console.error("Error deleting bid:", error)
    res.status(500).json({ message: "Failed to delete bid" })
  }
}

// Accept bid with enhanced escrow handling
exports.acceptBid = async (req, res) => {
  const { bidId } = req.params
  const userId = req.user.id

  const dbTransaction = await sequelize.transaction()

  try {
    // Find the bid with gig and user details
    const bid = await Bid.findOne({
      where: { id: bidId },
      include: [
        {
          model: Gig,
          where: { clientId: userId }, // Ensure only gig owner can accept
          include: [{ model: User, as: "client", attributes: ["id", "name", "email"] }],
        },
        { model: User, as: "freelancer", attributes: ["id", "name", "email"] },
      ],
      transaction: dbTransaction,
    })

    if (!bid) {
      await dbTransaction.rollback()
      return res.status(404).json({ message: "Bid not found or you don't have permission to accept it" })
    }

    if (bid.status !== "pending") {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "Bid is not in pending status" })
    }

    // Get client's wallet
    const clientWallet = await Wallet.findOne({
      where: { userId },
      transaction: dbTransaction,
      lock: true,
    })

    if (!clientWallet) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "Client wallet not found. Please create a wallet first." })
    }

    // Check if client has sufficient funds
    if (clientWallet.balance < bid.amount) {
      await dbTransaction.rollback()
      return res.status(400).json({
        message: "Insufficient wallet balance",
        required: bid.amount,
        available: clientWallet.balance,
        shortfall: bid.amount - clientWallet.balance,
      })
    }

    // Get or create freelancer's wallet
    let freelancerWallet = await Wallet.findOne({
      where: { userId: bid.freelancerId },
      transaction: dbTransaction,
    })

    if (!freelancerWallet) {
      freelancerWallet = await Wallet.create(
        {
          userId: bid.freelancerId,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
        { transaction: dbTransaction },
      )
    }

    // Create escrow transaction (move money from client to escrow)
    await createVerifiedTransaction(
      {
        type: "escrow",
        amount: bid.amount,
        status: "completed",
        userId: userId,
        walletId: clientWallet.id,
        gigId: bid.gigId,
        description: `Escrow payment for gig "${bid.Gig.title}"`,
        metadata: {
          bidId: bid.id,
          gigId: bid.gigId,
          freelancerId: bid.freelancerId,
          type: "gig_escrow",
        },
      },
      clientWallet.id,
    )

    // Add to freelancer's pending balance
    await freelancerWallet.update(
      {
        pendingBalance: freelancerWallet.pendingBalance + bid.amount,
        lastTransactionAt: new Date(),
      },
      { transaction: dbTransaction },
    )

    // Create pending transaction for freelancer
    await Transaction.create(
      {
        type: "escrow",
        amount: bid.amount,
        status: "pending",
        userId: bid.freelancerId,
        walletId: freelancerWallet.id,
        gigId: bid.gigId,
        description: `Pending payment for gig "${bid.Gig.title}"`,
        metadata: {
          bidId: bid.id,
          gigId: bid.gigId,
          clientId: userId,
          type: "freelancer_escrow",
        },
      },
      { transaction: dbTransaction },
    )

    // Update bid status
    await bid.update({ status: "accepted", acceptedAt: new Date() }, { transaction: dbTransaction })

    // Update gig status
    await bid.Gig.update({ status: "in_progress", acceptedBidId: bid.id }, { transaction: dbTransaction })

    // Reject all other bids for this gig
    await Bid.update(
      { status: "rejected" },
      {
        where: {
          gigId: bid.gigId,
          id: { [Op.ne]: bid.id },
          status: "pending",
        },
        transaction: dbTransaction,
      },
    )

    await dbTransaction.commit()

    // Send email notifications
    try {
      // Notify freelancer
      await sendEmail({
        to: bid.freelancer.email,
        subject: "Bid Accepted!",
        text: `Your bid of ₦${bid.amount} for "${bid.Gig.title}" has been accepted!`,
        html: `
          <h2>Congratulations! Your Bid Has Been Accepted!</h2>
          <p>Your bid of <strong>₦${bid.amount.toLocaleString()}</strong> for "<strong>${bid.Gig.title}</strong>" has been accepted!</p>
          <p>The payment has been placed in escrow and will be released to you upon successful completion of the work.</p>
          <p>Please log in to your dashboard to start working on this project.</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })

      // Notify client
      await sendEmail({
        to: bid.Gig.client.email,
        subject: "Bid Accepted Successfully",
        text: `You have successfully accepted a bid of ₦${bid.amount} for "${bid.Gig.title}".`,
        html: `
          <h2>Bid Accepted Successfully!</h2>
          <p>You have successfully accepted a bid of <strong>₦${bid.amount.toLocaleString()}</strong> for "<strong>${bid.Gig.title}</strong>".</p>
          <p>The payment has been placed in escrow and will be released to the freelancer upon completion.</p>
          <p>You can track the progress in your dashboard.</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError)
    }

    // Log the bid acceptance
    logger.info(`Bid accepted: ${bid.id} for gig ${bid.gigId} by client ${userId}`)

    res.json({
      message: "Bid accepted successfully",
      bid: {
        id: bid.id,
        amount: bid.amount,
        status: bid.status,
        acceptedAt: bid.acceptedAt,
      },
      escrowAmount: bid.amount,
    })
  } catch (error) {
    await dbTransaction.rollback()
    console.error("Error accepting bid:", error)
    res.status(500).json({ message: "Failed to accept bid", error: error.message })
  }
}

// Reject a bid
exports.rejectBid = async (req, res) => {
  const { bidId } = req.params
  const userId = req.user.id

  try {
    const bid = await Bid.findOne({
      where: { id: bidId },
      include: [
        {
          model: Gig,
          where: { clientId: userId },
        },
      ],
    })

    if (!bid) {
      return res.status(404).json({ message: "Bid not found or you don't have permission to reject it" })
    }

    if (bid.status !== "pending") {
      return res.status(400).json({ message: "Bid is not in pending status" })
    }

    await bid.update({ status: "rejected" })

    res.json({ message: "Bid rejected successfully" })
  } catch (error) {
    console.error("Error rejecting bid:", error)
    res.status(500).json({ message: "Failed to reject bid" })
  }
}

// Get a single bid by ID
exports.getBidById = async (req, res) => {
  const { bidId } = req.params
  const userId = req.user.id

  try {
    const bid = await Bid.findOne({
      where: { id: bidId },
      include: [
        {
          model: Gig,
          include: [{ model: User, as: "client", attributes: ["id", "name"] }],
        },
        {
          model: User,
          as: "freelancer",
          attributes: ["id", "name", "email"],
        },
      ],
    })

    if (!bid) {
      return res.status(404).json({ message: "Bid not found" })
    }

    // Check if user has permission to view this bid
    if (bid.freelancerId !== userId && bid.Gig.clientId !== userId) {
      return res.status(403).json({ message: "You don't have permission to view this bid" })
    }

    res.json(bid)
  } catch (error) {
    console.error("Error fetching bid:", error)
    res.status(500).json({ message: "Failed to fetch bid" })
  }
}

// Complete gig and release payment
exports.completeGig = async (req, res) => {
  const { gigId } = req.params
  const userId = req.user.id

  const dbTransaction = await sequelize.transaction()

  try {
    // Find the gig with accepted bid
    const gig = await Gig.findOne({
      where: { id: gigId, clientId: userId, status: "in_progress" },
      include: [
        {
          model: Bid,
          where: { status: "accepted" },
          include: [{ model: User, as: "freelancer", attributes: ["id", "name", "email"] }],
        },
        { model: User, as: "client", attributes: ["id", "name", "email"] },
      ],
      transaction: dbTransaction,
    })

    if (!gig || !gig.Bids || gig.Bids.length === 0) {
      await dbTransaction.rollback()
      return res.status(404).json({ message: "Gig not found or no accepted bid" })
    }

    const acceptedBid = gig.Bids[0]

    // Get freelancer's wallet
    const freelancerWallet = await Wallet.findOne({
      where: { userId: acceptedBid.freelancerId },
      transaction: dbTransaction,
      lock: true,
    })

    if (!freelancerWallet) {
      await dbTransaction.rollback()
      return res.status(400).json({ message: "Freelancer wallet not found" })
    }

    // Release payment from escrow to freelancer
    await freelancerWallet.update(
      {
        balance: freelancerWallet.balance + acceptedBid.amount,
        pendingBalance: freelancerWallet.pendingBalance - acceptedBid.amount,
        totalEarned: freelancerWallet.totalEarned + acceptedBid.amount,
        lastTransactionAt: new Date(),
      },
      { transaction: dbTransaction },
    )

    // Create release transaction
    await Transaction.create(
      {
        type: "release",
        amount: acceptedBid.amount,
        status: "completed",
        userId: acceptedBid.freelancerId,
        walletId: freelancerWallet.id,
        gigId: gig.id,
        description: `Payment released for completed gig "${gig.title}"`,
        metadata: {
          bidId: acceptedBid.id,
          gigId: gig.id,
          clientId: userId,
          type: "gig_completion",
        },
      },
      { transaction: dbTransaction },
    )

    // Update the pending escrow transaction to completed
    await Transaction.update(
      { status: "completed" },
      {
        where: {
          userId: acceptedBid.freelancerId,
          walletId: freelancerWallet.id,
          type: "escrow",
          status: "pending",
          gigId: gig.id,
        },
        transaction: dbTransaction,
      },
    )

    // Update gig and bid status
    await gig.update({ status: "completed", completedAt: new Date() }, { transaction: dbTransaction })
    await acceptedBid.update({ status: "completed" }, { transaction: dbTransaction })

    await dbTransaction.commit()

    // Send email notifications
    try {
      // Notify freelancer
      await sendEmail({
        to: acceptedBid.freelancer.email,
        subject: "Payment Released!",
        text: `Your payment of ₦${acceptedBid.amount} for "${gig.title}" has been released!`,
        html: `
          <h2>Payment Released!</h2>
          <p>Your payment of <strong>₦${acceptedBid.amount.toLocaleString()}</strong> for "<strong>${gig.title}</strong>" has been released to your wallet!</p>
          <p>Thank you for your excellent work!</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })

      // Notify client
      await sendEmail({
        to: gig.client.email,
        subject: "Gig Completed",
        text: `Your gig "${gig.title}" has been marked as completed.`,
        html: `
          <h2>Gig Completed!</h2>
          <p>Your gig "<strong>${gig.title}</strong>" has been marked as completed.</p>
          <p>Payment of <strong>₦${acceptedBid.amount.toLocaleString()}</strong> has been released to the freelancer.</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError)
    }

    // Log the gig completion
    logger.info(
      `Gig completed: ${gig.id} by client ${userId}, payment released to freelancer ${acceptedBid.freelancerId}`,
    )

    res.json({
      message: "Gig completed and payment released successfully",
      gig: {
        id: gig.id,
        status: gig.status,
        completedAt: gig.completedAt,
      },
      paymentReleased: acceptedBid.amount,
    })
  } catch (error) {
    await dbTransaction.rollback()
    console.error("Error completing gig:", error)
    res.status(500).json({ message: "Failed to complete gig", error: error.message })
  }
}

// Get bids (existing function - keeping complete)
exports.getBids = async (req, res) => {
  const { gigId } = req.query
  const userId = req.user.id

  try {
    const where = {}

    if (gigId) {
      // Get bids for a specific gig (only if user owns the gig)
      const gig = await Gig.findOne({
        where: { id: gigId, clientId: userId },
      })

      if (!gig) {
        return res.status(403).json({ message: "You don't have permission to view these bids" })
      }

      where.gigId = gigId
    } else {
      // Get user's own bids
      where.freelancerId = userId
    }

    const bids = await Bid.findAll({
      where,
      include: [
        {
          model: Gig,
          attributes: ["id", "title", "description", "budget", "status"],
          include: [{ model: User, as: "client", attributes: ["id", "name"] }],
        },
        {
          model: User,
          as: "freelancer",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    })

    res.json(bids)
  } catch (error) {
    console.error("Error fetching bids:", error)
    res.status(500).json({ message: "Failed to fetch bids" })
  }
}

// Get single bid (existing function - keeping complete)
exports.getBid = async (req, res) => {
  const { bidId } = req.params
  const userId = req.user.id

  try {
    const bid = await Bid.findOne({
      where: { id: bidId },
      include: [
        {
          model: Gig,
          include: [{ model: User, as: "client", attributes: ["id", "name"] }],
        },
        {
          model: User,
          as: "freelancer",
          attributes: ["id", "name", "email"],
        },
      ],
    })

    if (!bid) {
      return res.status(404).json({ message: "Bid not found" })
    }

    // Check if user has permission to view this bid
    if (bid.freelancerId !== userId && bid.Gig.clientId !== userId) {
      return res.status(403).json({ message: "You don't have permission to view this bid" })
    }

    res.json(bid)
  } catch (error) {
    console.error("Error fetching bid:", error)
    res.status(500).json({ message: "Failed to fetch bid" })
  }
}

// Delete bid (existing function - keeping complete)
exports.deleteBid = async (req, res) => {
  const { bidId } = req.params
  const userId = req.user.id

  try {
    const bid = await Bid.findOne({
      where: { id: bidId, freelancerId: userId, status: "pending" },
    })

    if (!bid) {
      return res.status(404).json({ message: "Bid not found or cannot be deleted" })
    }

    await bid.destroy()

    res.json({ message: "Bid deleted successfully" })
  } catch (error) {
    console.error("Error deleting bid:", error)
    res.status(500).json({ message: "Failed to delete bid" })
  }
}
