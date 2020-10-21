const GoogleLoginModel = require('../models/GoogleLoginModel');
const ObjectId = require('mongoose').Types.ObjectId;

function createFilter(params){
    let filter = {};

    if(!params){
        return filter;
    }

    if(params.email){
        filter.email = new RegExp(params.email, 'i');
    }
    if(params._id){
        try{
            filter._id = ObjectId(params._id);
        }catch(err){}
    }
    return filter;
}

module.exports = {
    list: async function(req, resp) {
        let filter = createFilter(JSON.parse(req.query.filter));
        let range = JSON.parse(req.query.range);

        let accounts;
        try{
            accounts = await GoogleLoginModel.find(filter).skip(range[1] * (range[0] - 1)).limit(range[1]);
            resp.set('Total-Documents', await GoogleLoginModel.countDocuments(filter));
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching GoogleLogin information",
                error: err
            });
        }

        return resp.status(200).json(accounts);
    },
    
    getByID: async function(req, resp) {
        let account;
        try{
            account = await GoogleLoginModel.findById(req.params.id);
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching Google Login Information",
                error: err
            });
        }

        if(!account){
            return resp.status(404).json({
                message: `Account ${req.params.id} does not exist`,
                error: "Not found"
            });
        }

        return resp.status(200).json(account);
    }
};