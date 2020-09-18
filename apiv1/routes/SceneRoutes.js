let express = require('express');
let router = express.Router();
let SceneController = require('../controllers/SceneController.js');
let auth = require('../middleware/authorization');

router.get("/", SceneController.list);
router.post("/", auth.requireLogin, SceneController.create);

router.get("/example", SceneController.getExamples);
router.post("/example", SceneController.promoteScene);

router.get("/id/:id", SceneController.getByID);
router.put("/id/:id", SceneController.update);
router.delete("/id/:id", SceneController.delete);

module.exports = router;
