const { Gig, User, Bid, Image, Transaction, View, sequelize } = require("../models")
const { Op } = require("sequelize")
const fs = require("fs")
const path = require("path")
const { uploadImage, deleteImage } = require("../utils/imageUtils")

// Create a new gig
exports.createGig = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { description, budget, duration, category, skills, campus } = req.body

    // Create the gig
    const gig = await Gig.create(
      {
        description,
        budget,
        duration,
        category,
        skills: skills ? skills.split(",") : [],
        campus,
        userId: req.user.id,
        status: "open",
      },
      { transaction: t },
    )

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(async (file, index) => {
        const result = await uploadImage(file.path)

        return Image.create(
          {
            url: result.secure_url,
            thumbnailUrl: result.secure_url.replace("/upload/", "/upload/w_200,h_200,c_fill/"),
            publicId: result.public_id,
            gigId: gig.id,
            isMain: index === 0, // First image is the main image
          },
          { transaction: t },
        )
      })

      await Promise.all(imagePromises)

      // Delete temporary files
      req.files.forEach((file) => {
        fs.unlinkSync(file.path)
      })
    }

    await t.commit()

    // Fetch the gig with its images
    const gigWithImages = await Gig.findByPk(gig.id, {
      include: [
        { model: Image },
        {
          model: User,
          as: "client",
          attributes: ["id", "name", "email", "campus"],
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Gig created successfully",
      data: gigWithImages,
    })
  } catch (error) {
    await t.rollback()
    console.error("Error creating gig:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create gig",
      error: error.message,
    })
  }
}

// Get all gigs with filtering options
exports.getGigs = async (req, res) => {
  try {
    const { campus, category, status, minBudget, maxBudget, search, page = 1, limit = 10 } = req.query

    const offset = (page - 1) * limit

    // Build filter conditions
    const where = {}

    if (campus) where.campus = campus
    if (category) where.category = category
    if (status) where.status = status

    if (minBudget || maxBudget) {
      where.budget = {}
      if (minBudget) where.budget[Op.gte] = minBudget
      if (maxBudget) where.budget[Op.lte] = maxBudget
    }

    if (search) {
      where[Op.or] = [{ description: { [Op.like]: `%${search}%` } }, { skills: { [Op.like]: `%${search}%` } }]
    }

    // Get gigs with pagination
    const { count, rows } = await Gig.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "name", "email", "campus"],
        },
        {
          model: Image,
          where: { isMain: true },
          required: false,
        },
        {
          model: Bid,
          attributes: [[sequelize.fn("COUNT", sequelize.col("Bids.id")), "bidCount"]],
          required: false,
        },
      ],
      group: ["Gig.id"],
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      subQuery: false,
    })

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: rows,
    })
  } catch (error) {
    console.error("Error fetching gigs:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch gigs",
      error: error.message,
    })
  }
}

// Get a single gig by ID
exports.getGigById = async (req, res) => {
  try {
    const { id } = req.params
    const visitorId = req.user?.id || req.headers["x-visitor-id"] || req.ip

    const gig = await Gig.findByPk(id, {
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "name", "email", "campus", "phone"],
        },
        {
          model: User,
          as: "freelancer",
          attributes: ["id", "name", "email", "campus", "phone"],
          required: false,
        },
        { model: Image },
        {
          model: Bid,
          include: [
            {
              model: User,
              attributes: ["id", "name", "email", "campus"],
            },
          ],
        },
      ],
    })

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      })
    }

    // Record view if not already viewed by this visitor
    const existingView = await View.findOne({
      where: {
        visitorId,
        gigId: id,
      },
    })

    if (!existingView) {
      // Create a new view record
      await View.create({
        visitorId,
        gigId: id,
        timestamp: new Date(),
      })

      // Increment the view count
      await Gig.update({ views: sequelize.literal("views + 1") }, { where: { id } })

      // Update the gig object to reflect the new view count
      gig.views += 1
    }

    res.status(200).json({
      success: true,
      data: gig,
    })
  } catch (error) {
    console.error("Error fetching gig:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch gig",
      error: error.message,
    })
  }
}

// Update a gig
exports.updateGig = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { description, budget, duration, category, skills, status } = req.body

    const gig = await Gig.findByPk(id)

    if (!gig) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      })
    }

    // Check if the user is the owner of the gig
    if (gig.userId !== req.user.id && req.user.role !== "admin") {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this gig",
      })
    }

    // Check if the gig can be updated (not in progress or completed)
    if (gig.status !== "open" && req.user.role !== "admin") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot update a gig that is already in progress or completed",
      })
    }

    // Update the gig
    await gig.update(
      {
        description: description || gig.description,
        budget: budget || gig.budget,
        duration: duration || gig.duration,
        category: category || gig.category,
        skills: skills ? skills.split(",") : gig.skills,
        status: status || gig.status,
      },
      { transaction: t },
    )

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      // Delete existing images if requested
      if (req.body.deleteImages === "true") {
        const existingImages = await Image.findAll({
          where: { gigId: gig.id },
        })

        for (const image of existingImages) {
          if (image.publicId) {
            await deleteImage(image.publicId)
          }
          await image.destroy({ transaction: t })
        }
      }

      // Upload new images
      const imagePromises = req.files.map(async (file, index) => {
        const result = await uploadImage(file.path)

        return Image.create(
          {
            url: result.secure_url,
            thumbnailUrl: result.secure_url.replace("/upload/", "/upload/w_200,h_200,c_fill/"),
            publicId: result.public_id,
            gigId: gig.id,
            isMain: index === 0 && req.body.deleteImages === "true", // First image is the main image if deleting all
          },
          { transaction: t },
        )
      })

      await Promise.all(imagePromises)

      // Delete temporary files
      req.files.forEach((file) => {
        fs.unlinkSync(file.path)
      })
    }

    await t.commit()

    // Fetch the updated gig with its images
    const updatedGig = await Gig.findByPk(gig.id, {
      include: [
        { model: Image },
        {
          model: User,
          as: "client",
          attributes: ["id", "name", "email", "campus"],
        },
      ],
    })

    res.status(200).json({
      success: true,
      message: "Gig updated successfully",
      data: updatedGig,
    })
  } catch (error) {
    await t.rollback()
    console.error("Error updating gig:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update gig",
      error: error.message,
    })
  }
}

// Delete a gig
exports.deleteGig = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params

    const gig = await Gig.findByPk(id, {
      include: [{ model: Image }],
    })

    if (!gig) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      })
    }

    // Check if the user is the owner of the gig
    if (gig.userId !== req.user.id && req.user.role !== "admin") {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this gig",
      })
    }

    // Check if the gig can be deleted (not in progress or completed)
    if (gig.status !== "open" && req.user.role !== "admin") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot delete a gig that is already in progress or completed",
      })
    }

    // Delete images from cloud storage
    if (gig.Images && gig.Images.length > 0) {
      for (const image of gig.Images) {
        if (image.publicId) {
          await deleteImage(image.publicId)
        }
      }
    }

    // Delete the gig (this will cascade delete related records)
    await gig.destroy({ transaction: t })

    await t.commit()

    res.status(200).json({
      success: true,
      message: "Gig deleted successfully",
    })
  } catch (error) {
    await t.rollback()
    console.error("Error deleting gig:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete gig",
      error: error.message,
    })
  }
}

// Get gigs by user ID (either as client or freelancer)
exports.getUserGigs = async (req, res) => {
  try {
    const { userId } = req.params
    const { role = "client", status } = req.query

    // Check if the user exists
    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Build filter conditions
    const where = {}

    if (role === "client") {
      where.userId = userId
    } else if (role === "freelancer") {
      where.freelancerId = userId
    }

    if (status) {
      where.status = status
    }

    // Get gigs
    const gigs = await Gig.findAll({
      where,
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
          required: false,
        },
        {
          model: Image,
          where: { isMain: true },
          required: false,
        },
        {
          model: Bid,
          attributes: [[sequelize.fn("COUNT", sequelize.col("Bids.id")), "bidCount"]],
          required: false,
        },
      ],
      group: ["Gig.id"],
      order: [["createdAt", "DESC"]],
    })

    res.status(200).json({
      success: true,
      count: gigs.length,
      data: gigs,
    })
  } catch (error) {
    console.error("Error fetching user gigs:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user gigs",
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

// Mark a gig as completed (by client)
exports.markGigCompleted = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params

    // Find the gig
    const gig = await Gig.findByPk(id, {
      include: [
        {
          model: User,
          as: "freelancer",
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

    // Check if the user is the owner of the gig
    if (gig.userId !== req.user.id && req.user.role !== "admin") {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to mark this gig as completed",
      })
    }

    // Check if the gig is in progress
    if (gig.status !== "in_progress") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot mark a gig as completed if it is not in progress",
      })
    }

    // Update the gig
    await gig.update(
      {
        status: "completed",
        completedAt: new Date(),
        paymentStatus: "released",
      },
      { transaction: t },
    )

    // Release payment from escrow to freelancer
    // This would typically involve your payment gateway
    // For now, we'll just create a transaction record

    await Transaction.create(
      {
        userId: gig.freelancerId,
        amount: gig.budget * 0.9, // 90% after platform fee
        fee: gig.budget * 0.1, // 10% platform fee
        type: "gig_release",
        status: "completed",
        gigId: gig.id,
        description: `Payment released for completed gig`,
        reference: `gig_${gig.id}_release_${Date.now()}`,
      },
      { transaction: t },
    )

    await t.commit()

    // Send notification to the freelancer (implement this)

    res.status(200).json({
      success: true,
      message: "Gig marked as completed and payment released to freelancer",
      data: await Gig.findByPk(id, {
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
    })
  } catch (error) {
    await t.rollback()
    console.error("Error marking gig as completed:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark gig as completed",
      error: error.message,
    })
  }
}

// Cancel a gig
exports.cancelGig = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { reason } = req.body

    // Find the gig
    const gig = await Gig.findByPk(id)

    if (!gig) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      })
    }

    // Check if the user is authorized (owner, assigned freelancer, or admin)
    const isOwner = gig.userId === req.user.id
    const isFreelancer = gig.freelancerId === req.user.id
    const isAdmin = req.user.role === "admin"

    if (!isOwner && !isFreelancer && !isAdmin) {
      await t.rollback()
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this gig",
      })
    }

    // Check if the gig can be cancelled (not already completed or cancelled)
    if (gig.status === "completed" || gig.status === "cancelled") {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a gig that is already completed or cancelled",
      })
    }

    // If in progress and payment is in escrow, refund to client
    if (gig.status === "in_progress" && gig.paymentStatus === "in_escrow") {
      // Create refund transaction
      await Transaction.create(
        {
          userId: gig.userId,
          amount: gig.budget,
          fee: 0, // No fee for refunds
          type: "gig_refund",
          status: "completed",
          gigId: gig.id,
          description: `Refund for cancelled gig. Reason: ${reason || "Not specified"}`,
          reference: `gig_${gig.id}_refund_${Date.now()}`,
        },
        { transaction: t },
      )
    }

    // Update the gig
    await gig.update(
      {
        status: "cancelled",
        paymentStatus: gig.paymentStatus === "in_escrow" ? "refunded" : gig.paymentStatus,
      },
      { transaction: t },
    )

    await t.commit()

    // Send notifications (implement this)

    res.status(200).json({
      success: true,
      message: "Gig cancelled successfully",
      data: await Gig.findByPk(id),
    })
  } catch (error) {
    await t.rollback()
    console.error("Error cancelling gig:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel gig",
      error: error.message,
    })
  }
}
