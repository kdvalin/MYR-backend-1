let { verifyGoogleToken, isAdmin } = require("../authorization/verifyAuth");
let SceneSchema = require('../models/SceneModel');
let fs = require("fs");

const JPG = ["FFD8FFDB", "FFD8FFE0"];

const root = (process.env.ROOT ? process.env.ROOT : '.');

const imgDest = `${root}/uploads`;
const notFound = `${root}/public/img/no_preview.jpg`;

const tmp = "/tmp";

function deleteImage(id){
    if(!fs.existsSync(`${imgDest}/${id}.jpg`)){
        return {
            errorCode: 404,
            error: "Not Found",
            message: `No Image exists for ${id}`
        };
    }
    
    try{
        fs.unlinkSync(`${imgDest}/${id}.jpg`);
    }catch(err){
        return {
            errorCode: 500,
            error: "Internal Server Error",
            message: err
        };
    }
    return true;
}

/**
 * Checks if the provided data URL makes a valid image and then creates an image based off of a data URL
 * 
 * @param {string} base64 The image represented as a base64 string
 * @param {string} id The scene ID for the image
 * @throws {string} Throws a string on error explaining why it failed
 */
function createImage(base64, id){
    let data = "";
    
    try{
        let result = base64.split(",")[1];
        data = (result !== undefined ? result : base64);
    }catch(e){
        data = base64;
    }

    let tmpFilePath = `${tmp}/${id}-${Date.now()}.jpg`;
    try{
        fs.writeFileSync(tmpFilePath, data, "base64");
    }catch(err) {
        throw "Error writing temporary image for validation";
    }

    let validImage = isImage(tmpFilePath);
    fs.unlinkSync(tmpFilePath);
    if(!validImage) {
        throw "Invalid image received";
    }
    
    try{
        fs.writeFileSync(`${imgDest}/${id}.jpg`, data, "base64");
    }catch(err){
        throw "Could not write image to final destination";
    }
}

/**
 * Processes the first 4 bytes of a file to determine if it is a vaild image
 * 
 * @param {Object} file A JSON object with a path specifying where the file is
 * 
 * @returns {boolean} Boolean on wheter the file is a valid image
 */
function isImage(file){
    let data = fs.readFileSync(file);

    //Using 1st 4 bytes to determine MIME Type
    data = data.subarray(0, 4);
    let mime = data.toString("hex").toUpperCase();

    switch(mime){
        case JPG[0]:
        case JPG[1]:
            return true;
        default:
            return false;
    }
}

module.exports = {
    create: function(req, res){
        let id = req.params.id;

        if(req.body.data === undefined){
            return res.status(400).json({
                error: "Bad Request",
                message: "No data sent"
            });
        }
        
        try {
            createImage(req.body.data, id);
        }catch(err) {
            return resp.status(500).json({
                message: "Error creating image",
                error: err
            });
        }
        
        return res.status(201).json({
            message: "Created"
        });
    },

    delete: async function (req, resp){
        let id = req.params.id;
    
        if(deleteImage(id)){
            return resp.status(204).send();
        }
        return resp.status(404).json({
            message: `Could not find an image for scene ${id}`,
            error: "Not found"
        });
    },

    update: function(req, resp){
        let id = req.params.id;

        try {
            createImage(req.body.data, id);
        }catch(err) {
            return res.status(500).json({
                message: "Error updating image",
                error: err
            });
        }

        return resp.status(204).send();
    },

    getByID: function(req, res){
        let id = req.params.id;

        SceneSchema.findById(id, (err, scene) =>{ 
            if(err){
                return res.status(500).json({
                    message: `Error finding scene ${id}`,
                    error: err
                });
            }
            if(!scene){
                return res.status(404).sendFile(notFound, {root: root});
            }
            if(!fs.existsSync(`${imgDest}/${id}.jpg`)){
                return res.status(404).sendFile(notFound, {root: root});
            }
            return res.status(200).sendFile(`${imgDest}/${id}.jpg`, {root: root});
        });
    },
    requireAuth: async function(req, res, next) {
        if(!req.headers["x-access-token"]) {
            return res.status(400).json({
                message: "Did not receive auth token",
                error: "Bad Request"
            });
        }
        res.uid = await verifyGoogleToken(req.headers["x-access-token"]);
        res.admin = await isAdmin(req.headers["x-access-token"]);

        if(!res.uid && !res.admin) {
            return res.status(400).json({
                message: "Invalid auth token received",
                error: "Unauthorized"
            });
        }

        next();
    },
    ownScene: async function(req, res, next) {
        const sceneId = req.params.id;
        let scene;
        try {
            scene = await SceneSchema.findById(sceneId);
        }catch(err) {
            return res.status(500).json({
                message: "Error retrieving scenes",
                error: err
            });
        }

        if(!scene) {
            return res.status(404).json({
                message: "Scene does not exist",
                error: "Not found"
            });
        }

        if(scene.uid.toString() !== res.uid.toString()) {
            return res.status(401).json({
                message: "You do not have permission to do that",
                error: "Unauthorized"
            });
        }
        next();
    },
    imageDoesNotExist: async function(req, res, next) {
        const sceneId = req.params.id;

        if(fs.existsSync(`${imgDest}/${sceneId}.jpg`)) {
            return res.status(409).json({
                message: "The image already exists, use a PUT request",
                error: "Conflict"
            });
        }

        next();
    },
    deleteImage: deleteImage,
    destFolder: imgDest,
    createImage: createImage
};