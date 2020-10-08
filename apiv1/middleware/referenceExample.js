let ReferenceExampleModel = require('../models/ReferenceExampleModel.js');

module.exports = {
    findExampleFunction: async function(req, res, next) {
        let functionName = req.params.functionName;

        let ReferenceExample;
        try {
            ReferenceExample = await ReferenceExampleModel.findOne({ functionName: functionName });
        }catch(err) {
            return res.status(500).json({
                message: "Error fetching Reference Example",
                error: err
            });
        }

        req.referenceExample = ReferenceExample;
        next();
    }
};