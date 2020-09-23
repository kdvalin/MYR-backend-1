let express = require('express');
let router = express.Router();
let UserController = require('../controllers/UserController.js');

const auth = require('../middleware/authorization');
const rateLimit = require("express-rate-limit");

const secureAPILimiter = rateLimit({
    windowMs: 2 * 60 * 1000,    // 2 minutes
    max: 200                    // max number of requests
});


/*
 * GET
 */
router.get('/', secureAPILimiter, auth.requireAdmin, UserController.list);

/*
 * GET
 */
router.get('/logout', UserController.logout);

/*
 * GET
 */
router.get('/profile', secureAPILimiter, auth.requireAdmin, UserController.show_profile);

/*
 * GET
 */
router.get('/id/:id', secureAPILimiter, auth.requireAdmin, UserController.show);

/*
 * POST
 */
router.post('/', secureAPILimiter, auth.requireAdmin, UserController.create);

/*
 * POST
 */
router.post('/login', secureAPILimiter, UserController.login);

/*
 * PUT
 */
router.put('/id/:id', secureAPILimiter, UserController.update);

/*
 * DELETE
 */
router.delete('/id/:id', secureAPILimiter, UserController.remove);

module.exports = router;
