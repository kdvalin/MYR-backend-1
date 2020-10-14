let express = require('express');
let router = express.Router();
let ReferenceExampleController = require('../controllers/ReferenceExampleController.js');
let auth = require('../middleware/authorization');
let refExMiddleware = require('../middleware/referenceExample');

/*
 * GET
 * Gets all examples from the database
 */
router.get('/', ReferenceExampleController.list);

/*
 * GET
 * Gets the example with the corresponding function name
 */
router.get('/:functionName', refExMiddleware.findExampleFunction, ReferenceExampleController.show_via_functionName);

/*
 * GET
 * Gets the example with the corresponding id
 */
router.get('/id/:id', refExMiddleware.findById, ReferenceExampleController.show);

/*
 * POST
 * Creates a new example by taking in a JSON object
 */
router.post('/', auth.requireAdmin, ReferenceExampleController.create);

/*
 * PUT
 * Modifies an existing example with the corresponding function name
 * by taking in a JSON object
 */
router.put('/:functionName', auth.requireAdmin, refExMiddleware.findExampleFunction, ReferenceExampleController.update_via_functionName);

/*
 * PUT
 * Modifies an existing example with the corresponding id
 * by taking in a JSON object
 */
router.put('/id/:id', ReferenceExampleController.update);

/*
 * DELETE
 * Deletes an example with the corresponding lesson number
 */
router.delete('/:functionName', ReferenceExampleController.remove_via_functionName);

/*
 * DELETE
 * Deletes an example with the corresponding id
 */
router.delete('/id/:id', auth.requireAdmin, refExMiddleware.findById, ReferenceExampleController.remove);

module.exports = router;
