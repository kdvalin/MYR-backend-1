let PreviewController = require('../controllers/PreviewController.js');
let express = require('express');
let router = express.Router();

router.get("/id/:id", PreviewController.getByID);
router.post("/id/:id", PreviewController.create);
router.put("/id/:id",  PreviewController.update);
router.delete("/id/:id", PreviewController.delete);

module.exports = router;