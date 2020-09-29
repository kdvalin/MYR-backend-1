let express = require('express');
let router = express.Router();
let CourseController = require('../controllers/CourseController.js');
let authMiddleware = require('../middleware/authorization');
router.get('/', CourseController.list);

router.get('/:shortname', CourseController.show_via_shortname);

router.get('/id/:id', CourseController.show);

router.post('/',authMiddleware.requireAdmin, CourseController.create);

router.put('/id/:id', authMiddleware.requireAdmin, CourseController.update);

router.delete('/id/:id', authMiddleware.requireAdmin, CourseController.remove);

module.exports = router;
