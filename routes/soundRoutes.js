const express = require("express");
const router = express.Router();
const soundController = require("../controllers/soundController");
const { authenticateUser, checkPremiumStatus } = require("../middlewares/authMiddleware");

// Public routes - accessible without authentication
router.get("/", authenticateUser, checkPremiumStatus, soundController.getSounds);
router.get("/rain", authenticateUser, checkPremiumStatus, soundController.getRainSound);
router.get("/soothing", authenticateUser, checkPremiumStatus, soundController.getSoothingSound);
router.get("/ocean", authenticateUser, checkPremiumStatus, soundController.getOceanSound);
router.get("/piano", authenticateUser, checkPremiumStatus, soundController.getPianoSound);
router.get("/play/:id", authenticateUser, checkPremiumStatus, soundController.getSoundById);

// Protected routes - require authentication
router.put("/update-all", authenticateUser, checkPremiumStatus, soundController.updateAllSounds);
router.delete("/delete-short-sounds", authenticateUser, checkPremiumStatus, soundController.deleteShortSounds);

module.exports = router;