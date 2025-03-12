const express = require("express");
const router = express.Router();
const soundController = require("../controllers/soundController");
const { checkPremiumStatus } = require("../middlewares/authMiddleware");

router.get("/",checkPremiumStatus, soundController.getSounds);
router.get("/rain",checkPremiumStatus, soundController.getRainSound);
router.get("/soothing",checkPremiumStatus, soundController.getSoothingSound);
router.get("/ocean",checkPremiumStatus, soundController.getOceanSound);
router.get("/piano",checkPremiumStatus, soundController.getPianoSound);
router.get("/play/:id",checkPremiumStatus, soundController.getSoundById);
router.put("/update-all",checkPremiumStatus, soundController.updateAllSounds);
router.delete("/delete-short-sounds",checkPremiumStatus, soundController.deleteShortSounds);

module.exports = router;
