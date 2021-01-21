const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    isValidObjectID: function(req, res, next) {
        if(!ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                message: "Resource does not exist",
                error: "Not Found"
            });
        }
        
        next();
    }
};