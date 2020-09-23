let express = require('express');
let router = express.Router();
let CollectControl = require("../controllers/CollectionController");
let authMiddleware = require("../middleware/authorization");

router.get('/', authMiddleware.requireAdminOrLogin,CollectControl.list);

router.get('/collectionID/:collectionName', authMiddleware.requireAdminOrLogin, CollectControl.show);
router.get(`/collectionID/:collectionID/exists`, CollectControl.exists);
router.get('/id/:id',authMiddleware.requireAdmin, CollectControl.getByID);

router.post('/', authMiddleware.requireLogin, CollectControl.create);

//router.put('/id/:id', CollectControl.update);

router.delete('/collectionID/:collectionName', authMiddleware.requireLogin, CollectControl.delete);

module.exports = router;
