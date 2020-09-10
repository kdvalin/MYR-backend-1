let { verifyGoogleToken, isAdmin } = require('../authorization/verifyAuth.js');
const { deleteImage, destFolder } = require('./ImageController');
let SceneSchema = require('../models/SceneModel');

const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs');

const invalid_token = {
    message: "Invalid token received",
    error: "Unauthorized"
};

function createFilter(params){
    let filter = {};

    if(!params){
        return filter;
    }

    if(params.name){
        filter.name = new RegExp(params.name, 'i');
    }
    if(params.uid) {
        try{
            filter.uid = ObjectId(params.uid);
        }catch(err){
            filter.uid = params.uid;
        }
    }
    return filter;
}

function buildScene(body, settings, dest = undefined){
    if(dest === undefined){
        return new SceneSchema({
            name: body.name,
            code: body.code,
            desc: body.desc,
            settings: settings,
            createTime: new Date(),
            updateTime: new Date()
        });
    }
    else{
        dest.name = body.name;
        dest.code = body.code;
        dest.settings = body.settings;
        dest.updateTime = new Date();
        return dest;
    }
}

module.exports = {
    create: async function(req, res){
        let body = req.body;
        if(Object.keys(body).length === 0 || !req.headers['x-access-token']){ //Check if a body was supplied
            return res.status(400).send("Bad Request");
        }

        let newScene = buildScene(body, body.settings);
        newScene.uid = req.uid;
        try{
            await newScene.save();
        }catch(err){
            return res.status(500).json({
                message: 'Error creating scene',
                error: err
            });
        }

        return res.status(201).send({_id: newScene.id});
    },

    list: async function(req, resp){
        if(!req.headers['x-access-token']){
            return resp.status(401).json({
                message: "No userID supplied",
                error: "Unauthorized"
            });
        }

        let filter;
        let range = [0, 0];

        if(req.query.filter){
            filter = JSON.parse(`${req.query.filter}`);
        }
        if(req.query.range){
            range = JSON.parse(`${req.query.range}`);
        }
        dbFilter = createFilter(filter);

        let uid = req.headers['x-access-token'];
        let admin = await isAdmin(req.headers["x-access-token"]);
        if(uid !== "1"){
            uid = await verifyGoogleToken(req.headers['x-access-token']);

            if(!uid && !admin){
                return resp.status(401).json(invalid_token);
            }
        }
        
        let scenes;
        try{
            if(admin){
                scenes = await SceneSchema.find(dbFilter).skip(range[1] * (range[0]-1)).limit(range[1]);
                resp.set('Total-Documents', await SceneSchema.countDocuments(dbFilter));
            }else{
                scenes = await SceneSchema.find({uid: uid});
            }
        }catch(err){
            return resp.status(500).json({
                message: "Error finding scenes",
                error: err
            });
        }
        return resp.json(scenes);
    },

    delete: async function (req, resp){
        let id = req.params.id;

        if(!req.headers['x-access-token']){
            return resp.status(400).json({
                message: "Missing user ID",
                error: "Bad Request"
            });
        }

        let uid = await verifyGoogleToken(req.headers['x-access-token']);
        let admin = await isAdmin(req.headers['x-access-token']);

        if(!admin && !uid){
            return resp.status(401).json({
                message: "Invalid token recieved",
                error: "Unauthorized"
            });
        }

        //Check to make sure that the scene exists
        let scene;
        try {
            scene = await SceneSchema.findById(id);
         }catch(err){
            return resp.status(500).json({
                message: "Error deleting Scene",
                error: err
            });
        }
        if(!scene){
            return resp.status(404).json({
                message: `Could not find scene id "${id}"`,
                error: "Scene Not Found"
            });
        }

        //Verify ownership of the scene before deleting it
        if(scene.uid.toString() !== uid.toString() && !admin){
            return resp.status(401).json({
                message: `You do not own scene "${id}"`,
                error: "Unauthorized"
            });
        }
        
        let result = deleteImage(id);
        if(result !== true && result.errorCode === 500) {
            return resp.status(500).json(result);
        }

        try{
            await SceneSchema.findByIdAndRemove(id);
        }catch(err){
            return resp.status(500).json({
                message: "Error deleting Scene",
                error: err
            });
        }
        return resp.status(204).send(""); //No Content
    },

    update: async function(req, resp){
        let id = req.params.id;
        let body = req.body;

        if(!req.headers['x-access-token']){
            return resp.status(400).json({
                message: "Missing user ID",
                error: "Bad Request"
            });
        }

        if(Object.keys(body) === 0 || body.settings === undefined){
            return resp.status(400).json({
                message: "Missing required fields",
                error: (Object.keys(body) == 0 ? "No body provided" : "No settings provided")
            });
        }
        
        let uid = await verifyGoogleToken(req.headers['x-access-token']);
        if(!uid){
            return resp.status(401).json({
                message: "Invalid token recieved",
                error: "Unauthorized"
            });
        }

        let scene;
        try{
            scene = await SceneSchema.findById(id);
        }catch(err){
            return resp.status(500).json({
                message: "Error getting scene",
                error: err
            });
        }
        
        if(!scene){
            return resp.status(404).json({
                message: `Could not find scene "${id}"`,
                error: "Scene not found"
            });
        }
        else if(scene.uid.toString() !== uid.toString()){
            return resp.status(401).json({
                message: `You do not own scene "${id}"`,
                error: "Unauthorized"
            });
        }

        scene.name = body.name;
        scene.code = body.code;
        scene.desc = body.desc;
        scene.settings = body.settings;
        scene.updateTime = new Date();

        try{
            await scene.save();
        }catch(err){
            return resp.status(500).json({
                message: "Error updating scene",
                error: err
            });
        }
        return resp.json(scene);//No Content
    },

    getByID: async function(req, res){
        let id = req.params.id;

        let scene;

        try{
            scene = await SceneSchema.findById(id);
        }catch(err) {
            //Might be a firebase ID
            try{
                scene = await SceneSchema.findOne({firebaseID: id});
            }catch(err){
                return res.status(500).json({
                    message: "Error Fetching Scenes",
                    error: err
                });
            }            
        }
        //Not found
        if(!scene){
            return res.status(404).json({
                message: `Could not find Scene ${id}`,
                error: "Scene not found"
            });
        }
        if(scene._id.toString() !== id){
            return res.redirect(301, `${scene._id}`);
        }

        return res.status(200).json(scene);
    },

    getExamples: async function(req, resp){
        let scenes;

        try{
            scenes = await SceneSchema.find({"uid": "1"});
        }catch(err){
            return resp.status(500).json({
                message: "Error Fetching Example Scenes",
                error: err
            });
        }

        return resp.status(200).json(scenes);
    },
    
    promoteScene: async function(req, resp) {
        let admin = await isAdmin(req.headers['x-access-token']);

        if(!admin){
            return resp.status(401).json({
                message: "You are not authorized to do this",
                error: "Unauthorized"
            });
        }

        let scene;
        try {
            scene = await SceneSchema.findById(ObjectId(req.body.id));

            if(!scene){
                return resp.status(404).json({
                    message: `Could not find scene with ID ${req.body.id}`,
                    error: "Not Found"
                });
            }
            scene.uid = "1";
            scene._id = ObjectId();
            scene.isNew = true;
            await scene.save();
        }catch(err){
            return resp.status(500).json({
                message: "Error creating copy of scene",
                error: err.toString()
            });
        }
        
        let imgError;
        try{
            fs.copyFileSync(`${destFolder}/${req.body.id}.jpg`, `${destFolder}/${scene._id.toString()}.jpg`);
        }catch(err){
            imgError = err.toString();
        }
        return resp.status(200).json({
            id: scene._id,
            imgError: imgError
        });
    }
};