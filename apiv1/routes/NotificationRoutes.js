let express = require('express');
let router = express.Router();
let NotifController = require("../controllers/NotificationController");
const authMiddleware = require("../middleware/authorization");

router.get("/", NotifController.fetch);
router.post("/", authMiddleware.requireAdmin, NotifController.create);

router.get("/id/:id", NotifController.find);
router.put("/id/:id", NotifController.update);
router.delete("/id/:id", NotifController.delete);

module.exports = router;