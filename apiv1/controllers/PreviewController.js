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
 * Creates an image based off of a data URL
 * 
 * @param {string} base64 The image represented as a base64 string
 * @param {string} path The path for the file to be saved
 * @returns {boolean} True on successful write to file, false otherwise
 */
function createImage(base64, path){
    let data = "";
    
    try{
        let result = base64.split(",")[1];
        data = (result !== undefined ? result : base64);
    }catch(e){
        data = base64;
    }

    try{
        fs.writeFileSync(path, data, "base64");
    }catch(err){
        console.error(err);
        return false;
    }
    return true;
}

/**
 * Processes common failures of HTTP requests
 * 
 * @param {string} sceneID The ID of the scene being used
 * @param {string} uid The ID of the user who made the request
 * @param {Express.Response} res The response variable (used for common rejections) 
 * @param {Object} file A JSON object that holds the path of the temporary file (undefined by default) 
 * @param {boolean} checkFile Initializes file checks (file is valid, valid image, etc) (false by default)
 * 
 * @returns {Promise<number>} Returns a promise that holds the HTTP status code for any failures, 200 if OK
 */
async function isValidRequest(sceneID, uid, res, file = undefined, checkFile = false){
    //Check to make sure that a vaild file was recieved
    let fileExists = (file && Object.keys(file) !== 0);
    if(checkFile && (!fileExists|| !isImage(file))){
        res.status(400).json({
            message: (!fileExists ? "No Image sent" : "Invalid Image sent"),
            error: "Bad Request"
        });
        return 400;
    }

    //User id supplied?
    if(!uid){
        res.status(401).json({
            message: "Missing user ID",
            error: "Unauthorized"
        });
        return 401;
    }
    let admin = await isAdmin(uid);
    uid = await verifyGoogleToken(uid);
    if(!uid && !admin){
        res.status(401).json({
            message: "Invalid authentication token",
            error: "Unauthorized"
        });
        return 401;
    }
    
    //Find the scene
    let response = 0;
    let scene;
    try{
        scene = await SceneSchema.findById(sceneID);
    }catch(err){
        if(err.name === "CastError"){
            response = 404;
            res.status(response).json({
                message: `Could not find scene ${sceneID}`,
                error: "Scene not found"
            });
            return response;
        }

        res.status(500).json({
            message: `Error fetching scene ${sceneID}`,
            error: err
        });
        return 500;
    }  

    if(!scene){
        response = 404;
        return res.status(response).json({
            message: `Could not find scene ${sceneID}`,
            error: "Scene not found"
        });
    }

    if(scene.uid.toString() !== uid.toString() && !admin){
        response = 401;
        return res.status(response).json({
            message: `You do not own scene ${sceneID}`,
            error: "Unauthorized"
        });
    }
    response = 200;
        
    return response;
}

/**
 * Cleans up in the case of an error with the request
 * @param {string} path The path of the file to be removed
 */
function cleanup(path){
    fs.unlinkSync(path);
}


/**
 * Processes the first 4 bytes of a file to determine if it is a vaild image
 * 
 * @param {Object} file A JSON object with a path specifying where the file is
 * 
 * @returns {boolean} Boolean on wheter the file is a valid image
 */
function isImage(file){
    let path = file.path;
    let data = fs.readFileSync(path);

    //Using 1st 4 bytes to determine MIME Type
    data = data.subarray(0, 4);
    let mime = data.toString("hex").toUpperCase();

    switch(mime){
        case JPG[0]:
        case JPG[1]:
            file.extension = "jpg";
            return true;
        default:
            return false;
    }
}

module.exports = {
    create: function(req, res){
        let id = req.params.id;
        let uid = req.headers['x-access-token'];
        let file = {
            //Using id in combo with timestamp to prevent collisions
            path: `${tmp}/${id}-${Date.now()}.jpg`
        };

        if(req.body.data === undefined){
            return res.status(400).json({
                error: "Bad Request",
                message: "No data sent"
            });
        }
        
        if(!createImage(req.body.data, file.path)){
            return res.status(500).json({
                error: "Internal Error",
                message: "Error decoding base64 string"
            });
        }

        return isValidRequest(id, uid, res, file, true).then((reason) => {
            if(reason === 200){
                //Check to make sure a file does not already exist
                if(fs.existsSync(`${imgDest}/${id}.jpg`)){
                    res.status(409).json({
                        message: `Scene ${id} already has a preview image, use PUT to update it`,
                        error: "Conflict"
                    });
                    cleanup(file.path);
                    return;
                }
                if(createImage(req.body.data, `${imgDest}/${id}.jpg`)) {
                    res.status(201).json({
                        message: "Created"
                    });
                }
                cleanup(file.path);
            }else if(file){
                cleanup(file.path);
            }
            return;
        });
    },

    delete: async function (req, resp){
        let id = req.params.id;
        let uid = req.headers['x-access-token'];
        
        let result = await isValidRequest(id, uid, resp);
        if(result === 200){
            if(deleteImage(id) === true){
                return resp.status(204).send();
            }
            return resp.status(404).json({
                message: `Could not find an image for scene ${id}`,
                error: "Not found"
            });
        }
    },

    update: function(req, resp){
        let id = req.params.id;
        let uid = req.headers['x-access-token'];
        let file = {
            path: `${tmp}/$${id}-${Date.now()}.jpg`
        };

        if(!createImage(req.body.data, file.path)){
            return res.status(500).json({
                error: "Internal Error",
                message: "Error decoding base64 string"
            });
        }

        isValidRequest(id, uid, resp, file, true).then((result) => {
            if(result === 200){
                if(!fs.existsSync(`${imgDest}/${id}.jpg`)){
                    resp.status(404).json({
                        message: `Scene ${id} does not have a preview, use POST to create one`,
                        error: "Preview not found"                        
                    });
                    cleanup(file.path);
                    return;
                }
                if(createImage(req.body.data, `${imgDest}/${id}.jpg`)) {
                    resp.status(204).send();
                }
                cleanup(file.path);
            }else if(file){
                cleanup(file.path);
            }
            return;
        });
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
    
    deleteImage: deleteImage,
    destFolder: imgDest
};