let ImageController = require('../controllers/ImageController.js');
let express = require('express');
let router = express.Router();

router.get("/id/:id", ImageController.getByID);
router.post("/id/:id", ImageController.requireAuth, ImageController.ownScene, 
    ImageController.imageDoesNotExist, ImageController.create);
router.put("/id/:id", ImageController.requireAuth, ImageController.ownScene, ImageController.update);
router.delete("/id/:id", ImageController.requireAuth, ImageController.ownScene, ImageController.delete);

module.exports = router;