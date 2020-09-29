let express = require('express');
let router = express.Router();
let SceneController = require('../controllers/SceneController.js');
let authMiddleware = require('../middleware/authorization');
let sceneMiddleware = require('../middleware/scenes');

router.get("/", authMiddleware.requireAdminOrLogin, SceneController.list);
router.post("/", authMiddleware.requireLogin, SceneController.create);

router.get("/example", SceneController.getExamples);
router.post("/example", authMiddleware.requireAdmin, SceneController.promoteScene);

router.get("/id/:id", SceneController.getByID);
router.put("/id/:id", authMiddleware.requireLogin,sceneMiddleware.ownScene, SceneController.update);
router.delete("/id/:id",authMiddleware.requireAdminOrLogin, sceneMiddleware.ownScene, SceneController.delete);

module.exports = router;
