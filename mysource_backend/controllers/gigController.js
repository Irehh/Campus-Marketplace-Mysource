const {
  Gig,
  User,
  Bid,
  Image,
  Transaction,
  View,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { processImage } = require("../utils/imageUtils");
const { sendNotificationToUser } = require("../controllers/pushController");
const logger = require("../utils/logger");
const { sendEmail } = require("../utils/emailUtils");
const emailTemplates = require("../utils/emailTemplates");

// Create a new gig
exports.createGig = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { title, description, budget, duration, category, skills, campus } =
      req.body;

    // Create the gig
    const gig = await Gig.create(
      {
        description: description || "", // Ensure description is never null
        budget: Number(budget) || 0,
        duration: Number(duration) || 1,
        category: category || "other", // Ensure category is never null
        skills: skills ? skills.split(",") : [],
        campus: campus || req.user.campus || "",
        userId: req.user.id,
        status: "open",
        views: 0,
      },
      { transaction: t }
    );

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(async (file) => {
        const imageData = await processImage(file);
        return Image.create(
          {
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            gigId: gig.id,
          },
          { transaction: t }
        );
      });

      await Promise.all(imagePromises);
    }

    await t.commit();

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
    });

    res.status(201).json({
      success: true,
      message: "Gig created successfully",
      data: gigWithImages,
    });
  } catch (error) {
    await t.rollback();
    logger.error("Error creating gig:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create gig",
      error: error.message,
    });
  }
};

// Get all gigs with filtering options
exports.getGigs = async (req, res) => {
  try {
    const {
      campus,
      category,
      status,
      minBudget,
      maxBudget,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = {};

    if (campus) where.campus = campus;
    if (category) where.category = category;
    if (status) where.status = status;

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget[Op.gte] = minBudget;
      if (maxBudget) where.budget[Op.lte] = maxBudget;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];

      // Check if skills is an array before searching in it
      if (where[Op.or]) {
        where[Op.or].push(
          sequelize.where(sequelize.cast(sequelize.col("skills"), "text"), {
            [Op.like]: `%${search}%`,
          })
        );
      }
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
          required: false,
        },
      ],
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    });

    // Get bid counts for each gig
    const gigIds = rows.map((gig) => gig.id);
    const bidCounts = await Bid.findAll({
      attributes: [
        "gigId",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        gigId: {
          [Op.in]: gigIds,
        },
      },
      group: ["gigId"],
    });

    // Create a map of gigId to bid count
    const bidCountMap = {};
    bidCounts.forEach((item) => {
      bidCountMap[item.gigId] = Number.parseInt(item.get("count"));
    });

    // Format the response
    const formattedGigs = rows.map((gig) => {
      const gigJson = gig.toJSON();
      return {
        ...gigJson,
        bidCount: bidCountMap[gig.id] || 0,
        images: gigJson.Images || [],
      };
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: formattedGigs,
    });
  } catch (error) {
    logger.error("Error fetching gigs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gigs",
      error: error.message,
    });
  }
};

// Get a single gig by ID
exports.getGigById = async (req, res) => {
  try {
    const { id } = req.params;
    const visitorId = req.user?.id || req.headers["x-visitor-id"] || req.ip;

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
              as: "bidder",
              attributes: ["id", "name", "email", "campus"],
            },
          ],
        },
      ],
    });

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // Record view if not already viewed by this visitor
    const existingView = await View.findOne({
      where: {
        visitorId,
        gigId: id,
        createdAt: {
          [Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (!existingView) {
      // Create a new view record
      await View.create({
        visitorId,
        gigId: id,
      });

      // Increment the view count
      await Gig.update(
        { views: sequelize.literal("views + 1") },
        { where: { id } }
      );

      // Update the gig object to reflect the new view count
      gig.views += 1;
    }

    // Get bid count
    const bidCount = await Bid.count({
      where: { gigId: id },
    });

    // Format the response
    const formattedGig = {
      ...gig.toJSON(),
      bidCount,
    };

    res.status(200).json({
      success: true,
      data: formattedGig,
    });
  } catch (error) {
    logger.error("Error fetching gig:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gig",
      error: error.message,
    });
  }
};

// Update a gig
exports.updateGig = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { description, budget, duration, category, skills, campus, deleteImages } = req.body;

    const gig = await Gig.findByPk(id);

    if (!gig) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // Check if the user is the owner of the gig
    if (gig.userId !== req.user.id && req.user.role !== "admin") {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this gig",
      });
    }

    // Check if the gig can be updated (not in progress or completed)
    if (gig.status !== "open" && req.user.role !== "admin") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot update a gig that is already in progress or completed",
      });
    }

    // Update the gig
    await gig.update(
      {
        description: description || gig.description,
        budget: budget ? Number(budget) : gig.budget,
        duration: duration ? Number(duration) : gig.duration,
        category: category || gig.category,
        skills: Array.isArray(skills) ? skills : gig.skills,
        campus: campus || gig.campus,
      },
      { transaction: t }
    );

    // Delete existing images if requested
    if (deleteImages === true || deleteImages === "true") {
      await Image.destroy({
        where: { gigId: id },
        transaction: t,
      });
    }

    await t.commit();

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
    });

    res.status(200).json({
      success: true,
      message: "Gig updated successfully",
      data: updatedGig,
    });
  } catch (error) {
    await t.rollback();
    logger.error("Error updating gig:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gig",
      error: error.message,
    });
  }
};

// Delete a gig
exports.deleteGig = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    const gig = await Gig.findByPk(id);

    if (!gig) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // Check if the user is the owner of the gig
    if (gig.userId !== req.user.id && req.user.role !== "admin") {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this gig",
      });
    }

    // Check if the gig can be deleted (not in progress or completed)
    if (gig.status !== "open" && req.user.role !== "admin") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot delete a gig that is already in progress or completed",
      });
    }

    // Delete associated images
    await Image.destroy({
      where: { gigId: id },
      transaction: t,
    });

    // Delete associated views
    await View.destroy({
      where: { gigId: id },
      transaction: t,
    });

    // Delete the gig
    await gig.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: "Gig deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error deleting gig:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gig",
      error: error.message,
    });
  }
};

// Add gig images
exports.addGigImages = async (req, res) => {
  const { id } = req.params;
  const gigId = parseInt(id); // Convert string to integer
  const userId = req.user.id; // Integer

  // Validate ID
  if (isNaN(gigId)) {
    return res.status(400).json({ success: false, message: "Invalid gig ID" });
  }

  try {
    // Check if gig exists and belongs to user
    const gig = await Gig.findOne({ where: { id: gigId } });

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    if (gig.userId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to update this gig" });
    }

    // Process images
    const imagePromises = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageData = await processImage(file);
        imagePromises.push(
          Image.create({
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            publicId: imageData.publicId,
            gigId,
          })
        );
      }
    }

    const images = await Promise.all(imagePromises);
    res.json({
      success: true,
      message: "Images uploaded successfully",
      data: images,
    });
  } catch (error) {
    logger.error("Error adding gig images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add gig images",
      error: error.message,
    });
  }
};

// Delete gig image
exports.deleteGigImage = async (req, res) => {
  const { id, imageId } = req.params;
  const gigId = parseInt(id); // Convert string to integer
  const parsedImageId = parseInt(imageId); // Convert string to integer
  const userId = req.user.id; // Integer

  // Validate IDs
  if (isNaN(gigId) || isNaN(parsedImageId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid gig or image ID" });
  }

  try {
    // Check if gig exists and belongs to user
    const gig = await Gig.findOne({
      where: { id: gigId },
      include: [{ model: Image }],
    });

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    if (gig.userId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to update this gig" });
    }

    // Check if image exists and belongs to this gig
    const image = gig.Images.find((img) => img.id === parsedImageId);
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    // Delete image
    await Image.destroy({ where: { id: parsedImageId } });

    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    logger.error("Error deleting gig image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gig image",
      error: error.message,
    });
  }
};

// Get gigs by user ID (either as client or freelancer)
exports.getUserGigs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = "client", status } = req.query;

    // Check if the user exists
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build filter conditions
    const where = {};

    if (role === "client") {
      where.userId = userId;
    } else if (role === "freelancer") {
      where.freelancerId = userId;
    }

    if (status) {
      where.status = status;
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
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get bid counts for each gig
    const gigIds = gigs.map((gig) => gig.id);
    const bidCounts = await Bid.findAll({
      attributes: [
        "gigId",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        gigId: {
          [Op.in]: gigIds,
        },
      },
      group: ["gigId"],
    });

    // Create a map of gigId to bid count
    const bidCountMap = {};
    bidCounts.forEach((item) => {
      bidCountMap[item.gigId] = Number.parseInt(item.get("count"));
    });

    // Format the response
    const formattedGigs = gigs.map((gig) => {
      const gigJson = gig.toJSON();
      return {
        ...gigJson,
        bidCount: bidCountMap[gig.id] || 0,
      };
    });

    res.status(200).json({
      success: true,
      count: gigs.length,
      data: formattedGigs,
    });
  } catch (error) {
    console.error("Error fetching user gigs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user gigs",
      error: error.message,
    });
  }
};

// Mark a gig as completed (by client)
exports.markGigCompleted = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Find the gig
    const gig = await Gig.findByPk(id, {
      include: [
        {
          model: User,
          as: "freelancer",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!gig) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // Check if the user is the owner of the gig
    if (gig.userId !== req.user.id && req.user.role !== "admin") {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not authorized to mark this gig as completed",
      });
    }

    // Check if the gig is in progress
    if (gig.status !== "in_progress") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot mark a gig as completed if it is not in progress",
      });
    }

    // Update the gig
    await gig.update(
      {
        status: "completed",
        completedAt: new Date(),
        paymentStatus: "released",
      },
      { transaction: t }
    );

    // Release payment from escrow to freelancer
    // This would typically involve your payment gateway
    // For now, we'll just create a transaction record

    await Transaction.create(
      {
        userId: gig.freelancerId,
        amount: gig.budget * 0.9, // 90% to freelancer (10% platform fee)
        fee: gig.budget * 0.1, // 10% platform fee - this is the marketplace commission
        type: "gig_release",
        status: "completed",
        gigId: gig.id,
        description: `Payment released for completed gig (10% platform fee deducted)`,
        reference: `gig_${gig.id}_release_${Date.now()}`,
      },
      { transaction: t }
    );

    await t.commit();

    // Send notification to the freelancer
    try {
      await sendNotificationToUser(
        gig.freelancerId,
        "Gig Completed",
        `Your gig has been marked as completed and payment has been released to your wallet.`,
        {
          type: "gig_completed",
          gigId: gig.id,
        }
      );
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`);
    }

    // Send email notification to the freelancer
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://127.0.1:5000";
      const gigUrl = `${frontendUrl}/gigs/${gig.id}`;

      const gigCompletedTemplate = emailTemplates.gigCompleted(
        gig.freelancer.name,
        gig.title,
        gig.budget * 0.9, // 90% after platform fee
        gigUrl
      );

      await sendEmail({
        to: gig.freelancer.email,
        subject: gigCompletedTemplate.subject,
        text: gigCompletedTemplate.text,
        html: gigCompletedTemplate.html,
      });

      logger.info(`Gig completion email sent to ${gig.freelancer.email}`);
    } catch (error) {
      logger.error(`Error sending gig completion email: ${error.message}`);
    }

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
          { model: Image },
        ],
      }),
    });
  } catch (error) {
    await t.rollback();
    console.error("Error marking gig as completed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark gig as completed",
      error: error.message,
    });
  }
};

// Cancel a gig
exports.cancelGig = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Find the gig
    const gig = await Gig.findByPk(id, {
      include: [
        {
          model: User,
          as: "freelancer",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "client",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!gig) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // Check if the user is authorized (owner, assigned freelancer, or admin)
    const isOwner = gig.userId === req.user.id;
    const isFreelancer = gig.freelancerId === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isFreelancer && !isAdmin) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this gig",
      });
    }

    // Check if the gig can be cancelled (not already completed or cancelled)
    if (gig.status === "completed" || gig.status === "cancelled") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a gig that is already completed or cancelled",
      });
    }

    // If in progress and payment is in escrow, refund to client
    if (gig.status === "in_progress" && gig.paymentStatus === "escrow") {
      // Create refund transaction
      await Transaction.create(
        {
          userId: gig.userId,
          amount: gig.budget,
          fee: 0, // No fee for refunds
          type: "gig_refund",
          status: "completed",
          gigId: gig.id,
          description: `Refund for cancelled gig. Reason: ${
            reason || "Not specified"
          }`,
          reference: `gig_${gig.id}_refund_${Date.now()}`,
        },
        { transaction: t }
      );
    }

    // Update the gig
    await gig.update(
      {
        status: "cancelled",
        paymentStatus:
          gig.paymentStatus === "escrow" ? "refunded" : gig.paymentStatus,
      },
      { transaction: t }
    );

    await t.commit();

    // Send notifications to relevant parties
    try {
      // If client cancelled, notify freelancer
      if (isOwner && gig.freelancerId) {
        await sendNotificationToUser(
          gig.freelancerId,
          "Gig Cancelled",
          `The gig "${gig.title}" has been cancelled by the client. Reason: ${
            reason || "Not specified"
          }`,
          {
            type: "gig_cancelled",
            gigId: gig.id,
          }
        );
      }

      // If freelancer cancelled, notify client
      if (isFreelancer) {
        await sendNotificationToUser(
          gig.userId,
          "Gig Cancelled",
          `The gig "${
            gig.title
          }" has been cancelled by the freelancer. Reason: ${
            reason || "Not specified"
          }`,
          {
            type: "gig_cancelled",
            gigId: gig.id,
          }
        );
      }
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Gig cancelled successfully",
      data: await Gig.findByPk(id),
    });
  } catch (error) {
    await t.rollback();
    console.error("Error cancelling gig:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel gig",
      error: error.message,
    });
  }
};

// Accept a bid and update gig status
exports.acceptBid = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { gigId, bidId } = req.params;
    const userId = req.user.id;

    // Validate IDs
    const gig = await Gig.findByPk(gigId, { transaction: t });
    if (!gig) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    // Check if user is the gig owner
    if (gig.userId !== userId && req.user.role !== "admin") {
      await t.rollback();
      return res.status(403).json({ success: false, message: "Not authorized to accept bids for this gig" });
    }

    // Check if gig is open
    if (gig.status !== "open") {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Cannot accept bid for a non-open gig" });
    }

    const bid = await Bid.findByPk(bidId, {
      include: [{ model: User, as: "bidder" }],
      transaction: t,
    });
    if (!bid || bid.gigId !== parseInt(gigId)) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Bid not found or does not belong to this gig" });
    }

    // Check client wallet
    const clientWallet = await Wallet.findOne({ where: { userId: gig.userId }, transaction: t });
    if (!clientWallet || clientWallet.balance < bid.amount) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Insufficient funds in client wallet" });
    }

    // Update gig status and assign freelancer
    await gig.update(
      {
        status: "in_progress",
        freelancerId: bid.userId,
        paymentStatus: "escrow",
      },
      { transaction: t }
    );

    // Deduct from client wallet
    await clientWallet.update(
      { balance: clientWallet.balance - bid.amount },
      { transaction: t }
    );

    // Create Transaction for escrow
    await Transaction.create(
      {
        type: "escrow",
        amount: bid.amount,
        status: "completed",
        description: `Escrow for gig #${gig.id} bid #${bid.id}`,
        userId: gig.userId, // Client
        walletId: clientWallet.id,
        gigId: gig.id,
        metadata: {
          bidId: bid.id,
          freelancerId: bid.userId,
          clientId: gig.userId,
          amount: bid.amount,
          createdAt: new Date().toISOString(),
        },
      },
      { transaction: t }
    );

    // Mark bid as accepted
    await bid.update({ status: "accepted" }, { transaction: t });

    // Reject other bids
    await Bid.update(
      { status: "rejected" },
      {
        where: { gigId: gig.id, id: { [sequelize.Op.ne]: bid.id }, status: "pending" },
        transaction: t,
      }
    );

    await t.commit();

    // Fetch updated gig
    const updatedGig = await Gig.findByPk(gig.id, {
      include: [
        { model: User, as: "client", attributes: ["id", "name", "email", "campus"] },
        { model: User, as: "freelancer", attributes: ["id", "name", "email"] },
        { model: Bid, include: [{ model: User, as: "freelancer" }] },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Bid accepted successfully",
      data: updatedGig,
    });
  } catch (error) {
    await t.rollback();
    logger.error("Error accepting bid:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept bid",
      error: error.message,
    });
  }
};
