let express = require('express');
let router = express.Router();
let NotifController = require("../controllers/NotificationController");
const NotifMiddleware = require("../middleware/notification");
const authMiddleware = require("../middleware/authorization");

router.get("/", NotifController.fetch);
router.post("/", authMiddleware.requireAdmin, NotifController.create);

router.get("/id/:id", NotifMiddleware.findByID, NotifController.find);
router.put("/id/:id", authMiddleware.requireAdmin, NotifMiddleware.findByID, NotifController.update);
router.delete("/id/:id", authMiddleware.requireAdmin, NotifMiddleware.findByID, NotifController.delete);

module.exports = router;