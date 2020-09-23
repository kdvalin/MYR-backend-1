let CollectSchema = require("../models/CollectionModel");
let SceneSchema = require("../models/SceneModel");
let {verifyGoogleToken, isAdmin} = require('../authorization/verifyAuth.js');
const ObjectId = require('mongoose').Types.ObjectId;

const noToken = {
    message: "No token was received",
    error: "Bad Request"
};
const badToken = {
    message: "An invalid token was received",
    error: "Unauthorized"
};

function createFilter(params){
    let filter = {};

    if(!params){
        return filter;
    }

    if(params.collectionID){
        filter.collectionID = new RegExp(params.collectionID, 'i');
    }
    if(params.uid) {
        try{
            filter.uid = ObjectId(params.uid);
        }catch(err){}
    }
    return filter;
}

module.exports = {
    list: async function(req, resp) {
        let filter = {};
        if(req.query.filter){
            filter = createFilter(JSON.parse(`${req.query.filter}`));
        }

        let range = [0, 0];
        if(req.query.range){
            range = JSON.parse(`${req.query.range}`);
        }

        let collections;
        try{
            if(req.admin){
                collections = await CollectSchema.find(filter).skip(range[1]*(range[0]-1)).limit(range[1]);
                resp.set('Total-Documents', await CollectSchema.countDocuments(filter));
            }else{
                collections = await CollectSchema.find({uid: req.uid});
            }
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collections",
                error: err
            });
        }
        if(!collections || collections.length == 0){
            return resp.status(204).send("");
        }
        return resp.status(200).json(collections);
    },

    create: async function(req, resp) {
        if(!req.body.collectID){
            return resp.status(400).json({
                message: "Did not receive field \"collectID\"",
                error: "Bad Request"
            });
        }
        let collectID = req.body.collectID;

        let collections = [];
        try{
            collections = await CollectSchema.find({"collectionID": collectID});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collections",
                error: err
            });
        }

        if(collections.length > 0){
            return resp.status(409).json({
                message: `${collectID} already exists as a collection`,
                error: "Conflict"
            });
        }
        let result;
        try{
            result = await CollectSchema.create({
                collectionID: collectID,
                uid: req.uid,
                timestamp: Date.now()
            });
        }catch(err){
            return resp.status(500).json({
                message: `Error creating collection ${collectID}`,
                error: err
            });
        }

        return resp.status(201).json(result);
    },

    show: async function(req, resp) {
        let collectionID = req.params.collectionName;

        let collection;
        try{
            collection = await CollectSchema.findOne({collectionID: collectionID});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collection",
                error: err
            });
        }

        if(!collection){
            return resp.status(404).json({
                message: `${collectionID} does not exist`,
                error: "Not Found"
            });
        }
        
        if(collection.uid.toString() !== req.uid.toString() && !req.admin){
            return resp.status(401).json({
                message: `You do not own "${collectionID}"`,
                error: "Unauthorized"
            });
        }
        let scenes = [];
        try{
            scenes = await SceneSchema.find({"settings.collectionID": collectionID});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collection scenes",
                error: err
            });
        }

        return resp.status(200).json(scenes);
    },

    delete: async function(req, resp){
        let collectionID = req.params.collectionName;

        let collection;
        try{
            collection = await CollectSchema.findOne({collectionID: collectionID});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collection",
                error: err
            });
        }

        if(!collection){
            return resp.status(404).json({
                message: `${collectionID} does not exist`,
                error: "Not Found"
            });
        }
        if(collection.uid.toString() !== req.uid.toString()){
            return resp.status(401).json({
                message: `You do not own ${collectionID}`,
                error: "Unauthorized"
            });
        }
        try{
            await collection.remove();
            await SceneSchema.updateMany(
                {"settings.collectionID": collectionID},
                {"$set": {
                    "settings": {"collectionID": ""}
                }
            });
        }catch(err){
            return resp.status(500).json({
                message: "Error removing collection",
                error: err
            });
        }
        return resp.status(204).send("");
    },
    
    getByID: async function(req, resp){
        let id = req.params.id;
        let collection;

        try{
            collection = await CollectSchema.findById(id);
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collection",
                error: err
            });
        }

        if(!collection){
            return resp.status(404).json({
                message: `${id} does not exist`,
                error: "Not Found"
            });
        }
        
        let scenes = [];
        try{
            scenes = await SceneSchema.find({"settings.collectionID": collection.collectionID});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collection scenes",
                error: err
            });
        }
        return resp.status(200).json({ 
            scenes: scenes,
            ...(collection.toJSON())
        });
    },

    exists: async function(req, resp) {
        let collectionID = req.params.collectionID;

        let collection;
        try {
            collection = await CollectSchema.findOne({collectionID: collectionID});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collection",
                error: err
            });
        }

        if(!collection){
            return resp.status(404).json({
                message: `Collection ${collectionID} does not exist`,
                error: "Not found"
            });
        }

        return resp.status(200).json({
            message: `Collection ${collectionID} exists!`
        });
    }
};