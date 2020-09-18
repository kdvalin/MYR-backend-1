const SceneSchema = require("../models/SceneModel");

const errors = {
    noLogin: {
        message: "You are currently not logged in",
        error: "Unauthorized"
    },
    noSceneId: {
        message: "No scene ID recongized",
        error: "Bad Request"
    },
    noOwnership: {
        message: "You do not own the requested scene",
        error: "Unauthorized"
    },
    notFound: {
        message: "No such scene exists",
        error: "Not found"
    }
};

/**
 * Checks to see if the user owns the scene
 * 
 * If req.user is not set, 401 will be sent.
 * If req.params.id is not set, a 400 will be sent
 * 
 * @param {Express.Request} req The HTTP request from Express, this REQUIRES a id parameter in a path
 * @param {Express.Response} res The HTTP response from Express
 * @param {function} next The next function to call in the callback chain in express
 */
async function ownScene(req, res, next) {
    if(!req.uid) {
        return res.status(401).json(errors.noLogin);
    }

    if(!req.params.id) {
        return res.status(400).json(errors.noSceneId);
    }

    let scene;
    try{
        scene = await SceneSchema.findById(req.params.id);
    }catch(err) {
        return res.status(500).json({
            message: "Error getting scene from database",
            error: err
        });
    }
    if(!scene) {
        return res.status(404).json(errors.notFound);
    }
    if(scene.uid.toString() !== req.uid) {
        return res.status(401).json(errors.noOwnership);
    }

    next();
}