const express = require("express")
const router = express.Router()
const bidController = require("../controllers/bidController")
const { authenticate } = require("../middleware/authMiddleware")

// All routes require authentication
router.use(authenticate)

// Submit a bid
router.post("/:gigId", bidController.createBid)

// Update a bid
router.put("/:id", bidController.updateBid)

// Withdraw a bid
router.delete("/:id", bidController.withdrawBid)

// Accept a bid
router.post("/:id/accept", bidController.acceptBid)

// Reject a bid
router.post("/:id/reject", bidController.rejectBid)

// Get all bids for a gig (for gig owner)
router.get("/gig/:gigId", bidController.getGigBids)

// Get user's bids
router.get("/user", bidController.getUserBids)

module.exports = router
