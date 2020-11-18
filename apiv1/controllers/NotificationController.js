let NotifSchema = require("../models/NotificationModel");
let verifyAuth = require("../authorization/verifyAuth");

const unauthorized = {
    message: "You do not have permission to do this",
    error: "Unauthorized"
};

const badRequest = {
    message: "Missing required fields",
    error: "Bad Request"
};

const notFound = {
    message: "No such notification",
    error: "Not Found"
};

const defaultNotifs = {
    endTime: {$gt: Date.now()},
    startTime: {$lt: Date.now()}
};

function createFilter(params){
    let filter = {};
    if(params === undefined){
        return defaultNotifs;
    }

    if(params.startTime){
        filter.startTime = {
            $gt: params.startTime
        };
    }

    if(params.endTime){
        filter.endTime = {
            $lt: params.endTime
        };
    }

    if(params.title){
        filter.title = new RegExp(params.title, "i");
    }

    return filter;
}

module.exports = {
    fetch: async function(req, resp){
        let filter = undefined;
        let range = [0, 0];

        if(req.query.filter){
            filter = JSON.parse(`${req.query.filter}`);
        }
        if(req.query.range){
            range = JSON.parse(`${req.query.range}`);
        }
        dbFilter = createFilter(filter);

        let notifs, count;
        try{
            if(range[0] === 0){
                notifs = await NotifSchema.find(dbFilter);
            }else{
                notifs = await NotifSchema.find(dbFilter).skip((range[0]-1)*range[1]).limit(range[1]);
            }
            count = await NotifSchema.count({});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching notifications",
                error: err
            });
        }
        resp.set('Total-Documents', count);
        return resp.status(200).json(notifs);
    },
    create: async function(req, resp){
        let body = req.body;
        
        if(!req.admin){
            return resp.status(401).json(unauthorized);
        }

        if(!body || !body.endTime || !body.message){
            return resp.status(400).json(badRequest);
        }
        if(!body.startTime){
            body.startTime = Date.now();
        }
        let notif;
        try{
            notif = await NotifSchema.create(body);
        }catch(err){
            return resp.status(500).json({
                message: "Error creating Notification",
                error: err
            });
        }
        return resp.status(201).json(notif);
    },
    update: async function(req, resp){
        let body = req.body;

        if(!req.admin){
            return resp.status(401).json(unauthorized);
        }

        if(!body || !body.message || !body.endTime){
            return resp.status(400).json(badRequest);
        }

        if(!req.notif){
            return resp.status(404).json(notFound);
        }
        if(!body.startTime){
            body.startTime = Date.now();
        }

        try{
            await req.notif.update(body);
        }catch(err){
            return resp.status(500).json({
                message: "Error updating notification",
                error: err
            });
        }

        return resp.sendStatus(204);
    },
    delete: async function(req, resp){
        if(!req.admin){
            return resp.status(401).json(unauthorized);
        }

        if(!req.notif){
            return resp.status(404).json(notFound);
        }

        try{
            await req.notif.remove();
        }catch(err){
            return resp.status(500).json({
                message: "Error deleting Notification",
                error: err
            });
        }

        return resp.sendStatus(204);
    },
    find: async function(req, resp){
        return resp.status(200).json(req.notif);
    }
};