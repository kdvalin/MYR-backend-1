let express = require('express');
let router = express.Router();
let SceneController = require('../controllers/SceneController.js');

router.get("/", SceneController.list);
router.post("/", SceneController.create);

router.get("/export", SceneController.requireAuth, SceneController.export);

router.get("/example", SceneController.getExamples);
router.post("/example", SceneController.promoteScene);

router.get("/id/:id", SceneController.getByID);
router.put("/id/:id", SceneController.update);
router.delete("/id/:id", SceneController.delete);

module.exports = router;
