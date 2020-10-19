const SnapshotModel = require("../models/SnapshotModel");

module.exports = {
    //Requires ID parameter in the path
    SnapshotExists: async function(req, res, next) {
        const id = req.params.id;

        let snapshot;
        try {
            snapshot = await SnapshotModel.findById(id);
        }catch(err) {
            return res.status(500).json({
                message: "Error fetching Snapshot",
                error: err
            });
        }

        if(!snapshot) {
            return res.status(404).json({
                message: `Snapshot "${id}" does not exist`,
                error: "Not found"
            });
        }

        req.snapshot = snapshot;
        next();
    }
};