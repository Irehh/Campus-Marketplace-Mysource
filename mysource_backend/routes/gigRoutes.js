const express = require("express")
const router = express.Router()
const gigController = require("../controllers/gigController")
const bidController = require("../controllers/bidController")
const { authenticate, optionalAuth } = require("../middleware/authMiddleware")
// Public routes with optional authentication
router.get("/", optionalAuth, gigController.getGigs)
router.get("/:id", optionalAuth, gigController.getGigById)

// Protected routes
router.post("/", authenticate, gigController.createGig)
router.put("/:id", authenticate, gigController.updateGig)
router.delete("/:id", authenticate, gigController.deleteGig)

// Image routes
router.post(
  "/:id/images",
  authenticate,
  (req, res, next) => {
    upload.array("images", 5)(req, res, (err) => { // Allow up to 5 images to match EditGigPage.js
      if (err) return next(err);
      next();
    });
  },
  gigController.addGigImages
);

router.delete("/:id/images/:imageId", authenticate, gigController.deleteGigImage);

// User gigs
router.get("/user/:userId", optionalAuth, gigController.getUserGigs)
router.get("/my/client", authenticate, (req, res) => {
  req.params.userId = req.user.id
  req.query.role = "client"
  gigController.getUserGigs(req, res)
})
router.get("/my/freelancer", authenticate, (req, res) => {
  req.params.userId = req.user.id
  req.query.role = "freelancer"
  gigController.getUserGigs(req, res)
})

// Bid routes
router.post("/:gigId/bids", authenticate, bidController.createBid)
router.get("/:gigId/bids", optionalAuth, bidController.getBidsByGig)
router.post("/:gigId/bids/:bidId/accept", authenticate, gigController.acceptBid)

// Gig status management
router.post("/:id/complete", authenticate, gigController.markGigCompleted)
router.post("/:id/cancel", authenticate, gigController.cancelGig)

module.exports = router
