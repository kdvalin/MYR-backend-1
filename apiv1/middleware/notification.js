const NotifSchema = require("../models/NotificationModel");
const mongoose = require("mongoose");

const errors = {
    notFound: {
        message: "The notification could not be found",
        error: "Not Found"
    }
};


module.exports = {
    //Will require an ID paramteter in order to work
    findByID: async function(req, res, next) {
        const id = req.params.id;

        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json(errors.notFound);
        }
        let notification;
        try {
            notification = await NotifSchema.findById(id);
        }catch(err) {
            return res.status(500).json({
                message: "Error fetching the notification",
                error: err
            });
        }

        req.notif = notification;
        next();
    }
};