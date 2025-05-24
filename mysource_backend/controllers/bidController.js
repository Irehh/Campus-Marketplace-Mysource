const { Bid, Gig, User, Wallet, Transaction, sequelize, Sequelize } = require("../models")
const { Op } = Sequelize
const logger = require("../utils/logger")
const { sendNotificationToUser } = require("../controllers/pushController")
const { sendEmail } = require("../utils/emailUtils")
const emailTemplates = require("../utils/emailTemplates")

// Create a new bid
exports.createBid = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { gigId, amount, proposal, deliveryTime } = req.body
    const userId = req.user.id

    // Check if the gig exists
    const gig = await Gig.findByPk(gigId, {
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "name", "email"],
        },
      ],
    })

    if (!gig) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      })
    }

    // Check if the gig is still open for bids
    if (gig.status !== "open") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "This gig is not open for bids",
      })
    }

    // Check if the user is not bidding on their own gig
    if (gig.userId === userId) {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "You cannot bid on your own gig",
      })
    }

    // Check if the user has already placed a bid on this gig
    const existingBid = await Bid.findOne({
      where: {
        gigId,
        userId,
        status: {
          [Op.notIn]: ["withdrawn", "rejected"],
        },
      },
    })

    if (existingBid) {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "You have already placed a bid on this gig",
      })
    }

    // Create the bid
    const bid = await Bid.create(
      {
        gigId,
        userId,
        amount,
        proposal,
        deliveryTime,
      },
      { transaction: t },
    )

    await t.commit()

    // Get bidder information
    const bidder = await User.findByPk(userId, {
      attributes: ["id", "name", "email"],
    })

    // Send push notification to the gig owner
    try {
      await sendNotificationToUser(
        gig.userId,
        "New Bid Received",
        `You have received a new bid on your gig from ${bidder.name}`,
        {
          type: "bid",
          gigId: gig.id,
          bidId: bid.id,
        },
      )
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`)
    }

    logger.info(`Bid created: ${bid.id} for gig ${gigId} by user ${userId}`)

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: bid,
    })
  } catch (error) {
    await t.rollback()
    logger.error(`Error creating bid: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error placing bid",
      error: error.message,
    })
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

// Accept a bid and update gig status
exports.acceptBid = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { gigId, bidId } = req.params

    // Find the gig
    const gig = await Gig.findByPk(gigId)

    if (!gig) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      })
    }

    // Check if the user is the owner of the gig
    if (gig.userId !== req.user.id) {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept bids for this gig",
      })
    }

    // Check if the gig is still open
    if (gig.status !== "open") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot accept bid for a gig that is not open",
      })
    }

    // Find the bid
    const bid = await Bid.findOne({
      where: {
        id: bidId,
        gigId,
      },
      include: [{ model: User }],
    })

    if (!bid) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Update the gig with the freelancer and change status
    await gig.update(
      {
        freelancerId: bid.userId,
        status: "in_progress",
        paymentStatus: "pending",
      },
      { transaction: t },
    )

    // Update the bid status
    await bid.update(
      {
        status: "accepted",
      },
      { transaction: t },
    )

    // Reject all other bids
    await Bid.update(
      { status: "rejected" },
      {
        where: {
          gigId,
          id: { [Op.ne]: bidId },
        },
        transaction: t,
      },
    )

    await t.commit()

    // Send notification to the freelancer (implement this)

    res.status(200).json({
      success: true,
      message: `Bid accepted. ${bid.User.name} has been assigned to this gig.`,
      data: {
        gig: await Gig.findByPk(gigId, {
          include: [
            {
              model: User,
              as: "client",
              attributes: ["id", "name", "email", "campus"],
            },
            {
              model: User,
              as: "freelancer",
              attributes: ["id", "name", "email", "campus"],
            },
          ],
        }),
        bid,
      },
    })
  } catch (error) {
    await t.rollback()
    console.error("Error accepting bid:", error)
    res.status(500).json({
      success: false,
      message: "Failed to accept bid",
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
          attributes: ["id", "budget", "status", "campus"],
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
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { amount, proposal, deliveryTime } = req.body
    const userId = req.user.id

    const bid = await Bid.findByPk(id, {
      include: [
        {
          model: Gig,
          attributes: ["id", "title", "status", "userId"],
          include: [
            {
              model: User,
              as: "client",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    })

    if (!bid) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Check if the user is the owner of the bid
    if (bid.userId !== userId) {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this bid",
      })
    }

    // Check if the bid can be updated
    if (bid.status !== "pending") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "This bid cannot be updated",
      })
    }

    // Check if the gig is still open
    if (bid.Gig.status !== "open") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "The gig is no longer open for bids",
      })
    }

    // Update the bid
    await bid.update(
      {
        amount: amount || bid.amount,
        proposal: proposal || bid.proposal,
        deliveryTime: deliveryTime || bid.deliveryTime,
      },
      { transaction: t },
    )

    await t.commit()

    // Get bidder information
    const bidder = await User.findByPk(userId, {
      attributes: ["id", "name", "email"],
    })

    // Send push notification to the gig owner
    try {
      await sendNotificationToUser(
        bid.Gig.userId,
        "Bid Updated",
        `${bidder.name} has updated their bid on your gig "${bid.Gig.title}"`,
        {
          type: "bid_update",
          gigId: bid.Gig.id,
          bidId: bid.id,
        },
      )
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`)
    }

    logger.info(`Bid updated: ${bid.id} by user ${userId}`)

    return res.status(200).json({
      success: true,
      message: "Bid updated successfully",
      data: bid,
    })
  } catch (error) {
    await t.rollback()
    logger.error(`Error updating bid: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error updating bid",
      error: error.message,
    })
  }
}

// Withdraw a bid
exports.withdrawBid = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const userId = req.user.id

    const bid = await Bid.findByPk(id, {
      include: [
        {
          model: Gig,
          attributes: ["id", "title", "status", "userId"],
          include: [
            {
              model: User,
              as: "client",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    })

    if (!bid) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Check if the user is the owner of the bid
    if (bid.userId !== userId) {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to withdraw this bid",
      })
    }

    // Check if the bid can be withdrawn
    if (bid.status !== "pending") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "This bid cannot be withdrawn",
      })
    }

    // Update the bid
    await bid.update(
      {
        status: "withdrawn",
      },
      { transaction: t },
    )

    await t.commit()

    // Get bidder information
    const bidder = await User.findByPk(userId, {
      attributes: ["id", "name", "email"],
    })

    // Send push notification to the gig owner
    try {
      await sendNotificationToUser(
        bid.Gig.userId,
        "Bid Withdrawn",
        `${bidder.name} has withdrawn their bid on your gig "${bid.Gig.title}"`,
        {
          type: "bid_withdrawn",
          gigId: bid.Gig.id,
          bidId: bid.id,
        },
      )
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`)
    }

    logger.info(`Bid withdrawn: ${bid.id} by user ${userId}`)

    return res.status(200).json({
      success: true,
      message: "Bid withdrawn successfully",
      data: bid,
    })
  } catch (error) {
    await t.rollback()
    logger.error(`Error withdrawing bid: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error withdrawing bid",
      error: error.message,
    })
  }
}

// Accept a bid
exports.acceptBid = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const userId = req.user.id

    const bid = await Bid.findByPk(id, {
      include: [
        {
          model: Gig,
          attributes: ["id", "title", "status", "userId", "budget", "escrowAmount"],
          include: [
            {
              model: User,
              as: "client",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: User,
          as: "bidder",
          attributes: ["id", "name", "email"],
        },
      ],
    })

    if (!bid) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Check if the user is the owner of the gig
    if (bid.Gig.userId !== userId) {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this bid",
      })
    }

    // Check if the gig is still open
    if (bid.Gig.status !== "open") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "The gig is no longer open for bids",
      })
    }

    // Check if the bid is still pending
    if (bid.status !== "pending") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "This bid cannot be accepted",
      })
    }

    // Get the client's wallet
    let clientWallet = await Wallet.findOne({ where: { userId } })

    // Create wallet if it doesn't exist
    if (!clientWallet) {
      clientWallet = await Wallet.create({ userId }, { transaction: t })
    }

    // Check if the client has enough balance
    if (clientWallet.balance < bid.amount) {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "Insufficient balance to accept this bid",
      })
    }

    // Update the bid
    await bid.update(
      {
        status: "accepted",
      },
      { transaction: t },
    )

    // Update the gig
    await bid.Gig.update(
      {
        status: "in_progress",
        freelancerId: bid.userId,
        escrowAmount: bid.amount,
        paymentStatus: "escrow",
      },
      { transaction: t },
    )

    // Deduct the amount from the client's wallet
    await clientWallet.update(
      {
        balance: sequelize.literal(`balance - ${bid.amount}`),
        totalSpent: sequelize.literal(`totalSpent + ${bid.amount}`),
      },
      { transaction: t },
    )

    // Create a transaction record
    await Transaction.create(
      {
        type: "escrow",
        amount: bid.amount,
        status: "completed",
        description: `Escrow payment for gig: ${bid.Gig.title}`,
        userId,
        walletId: clientWallet.id,
        gigId: bid.Gig.id,
        metadata: {
          bidId: bid.id,
          freelancerId: bid.userId,
        },
      },
      { transaction: t },
    )

    // Reject all other bids
    await Bid.update(
      { status: "rejected" },
      {
        where: {
          gigId: bid.Gig.id,
          id: { [Op.ne]: bid.id },
          status: "pending",
        },
        transaction: t,
      },
    )

    await t.commit()

    // Send push notification to the freelancer
    try {
      await sendNotificationToUser(
        bid.userId,
        "Bid Accepted",
        `Your bid on the gig "${bid.Gig.title}" has been accepted`,
        {
          type: "bid_accepted",
          gigId: bid.Gig.id,
          bidId: bid.id,
        },
      )
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`)
    }

    // Send email notification to the freelancer
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://127.0.1:5000"
      const gigUrl = `${frontendUrl}/gigs/${bid.Gig.id}`

      const bidAcceptedTemplate = emailTemplates.bidAccepted(bid.bidder.name, bid.Gig.title, bid.amount, gigUrl)

      await sendEmail({
        to: bid.bidder.email,
        subject: bidAcceptedTemplate.subject,
        text: bidAcceptedTemplate.text,
        html: bidAcceptedTemplate.html,
      })

      logger.info(`Bid acceptance email sent to ${bid.bidder.email}`)
    } catch (error) {
      logger.error(`Error sending bid acceptance email: ${error.message}`)
    }

    logger.info(`Bid accepted: ${bid.id} for gig ${bid.Gig.id} by user ${userId}`)

    return res.status(200).json({
      success: true,
      message: "Bid accepted successfully",
      data: bid,
    })
  } catch (error) {
    await t.rollback()
    logger.error(`Error accepting bid: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error accepting bid",
      error: error.message,
    })
  }
}

// Reject a bid
exports.rejectBid = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const userId = req.user.id

    const bid = await Bid.findByPk(id, {
      include: [
        {
          model: Gig,
          attributes: ["id", "title", "status", "userId"],
          include: [
            {
              model: User,
              as: "client",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: User,
          as: "bidder",
          attributes: ["id", "name", "email"],
        },
      ],
    })

    if (!bid) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Check if the user is the owner of the gig
    if (bid.Gig.userId !== userId) {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this bid",
      })
    }

    // Check if the bid is still pending
    if (bid.status !== "pending") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "This bid cannot be rejected",
      })
    }

    // Update the bid
    await bid.update(
      {
        status: "rejected",
      },
      { transaction: t },
    )

    await t.commit()

    // Send push notification to the bidder
    try {
      await sendNotificationToUser(
        bid.userId,
        "Bid Rejected",
        `Your bid on the gig "${bid.Gig.title}" has been rejected`,
        {
          type: "bid_rejected",
          gigId: bid.Gig.id,
          bidId: bid.id,
        },
      )
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`)
    }

    logger.info(`Bid rejected: ${bid.id} for gig ${bid.Gig.id} by user ${userId}`)

    return res.status(200).json({
      success: true,
      message: "Bid rejected successfully",
      data: bid,
    })
  } catch (error) {
    await t.rollback()
    logger.error(`Error rejecting bid: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error rejecting bid",
      error: error.message,
    })
  }
}

// Get a single bid by ID
exports.getBidById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const bid = await Bid.findByPk(id, {
      include: [
        {
          model: Gig,
          attributes: ["id", "title", "description", "budget", "status", "userId"],
          include: [
            {
              model: User,
              as: "client",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: User,
          as: "bidder",
          attributes: ["id", "name", "email"],
        },
      ],
    })

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Check if the user is authorized to view the bid
    if (bid.userId !== userId && bid.Gig.userId !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this bid",
      })
    }

    // Mark the bid as read if the user is the gig owner
    if (bid.Gig.userId === userId && !bid.isRead) {
      await bid.update({ isRead: true })
    }

    return res.status(200).json({
      success: true,
      data: bid,
    })
  } catch (error) {
    logger.error(`Error fetching bid: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Error fetching bid",
      error: error.message,
    })
  }
}
