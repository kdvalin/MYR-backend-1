let express = require('express');
let authMiddleware = require("../middleware/authorization");
let router = express.Router();
const GoogleLoginController = require('../controllers/GoogleLoginController');
router.get('/', authMiddleware.requireAdmin,GoogleLoginController.list);

router.get('/id/:id',authMiddleware.requireAdmin, GoogleLoginController.getByID);

module.exports = router;