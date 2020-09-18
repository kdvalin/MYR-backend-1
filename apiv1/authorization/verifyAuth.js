let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');

let config = require('../config/config');
let UserModel = require('../models/UserModel.js');
let GoogleLoginModel = require("../models/GoogleLoginModel");

const CLIENTID = process.env.GOOGLE_OAUTH2_CLIENTID;
const client = new OAuth2Client(CLIENTID);

async function verifyGoogleToken(token) {
    let ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENTID
    }).catch(() => {});

    if(ticket){
        let user;
        try{
            user = await GoogleLoginModel.findOne({googleId: ticket.payload["sub"]});
        }catch(err){}

        if(!user){
            try{
                user = await GoogleLoginModel.findOne({email: ticket.payload["email"]});
                await user.update({googleId: ticket.payload["sub"]});
            }catch(err){
                user = await GoogleLoginModel.create({
                    email: ticket.payload["email"],
                    googleId: ticket.payload["sub"]
                });
            }
        }

        return user._id;
    }

    return false;
}

async function isAdmin(token) {
    if (!token) {
        return false;
    }

    let decoded;
    try{
        decoded = jwt.verify(token, config.secret);
    }catch(err){
        console.log('Token verification error');
        return false;
    }
    let adminUser;
    try{
        adminUser = await UserModel.findById(decoded.id, { password: 0 }); 
    }catch(err){
        console.log('User lookup error');
        return false;
    }

    if (!adminUser) {
        console.log('No user found error');
        return false;
    }

    if(!adminUser.admin) {
        console.log('User is not an admin');
        return false;
    }

    return adminUser._id.toString();
    //console.log('return val ' + isUserAdmin)
    //return isUserAdmin;
}

module.exports = {
    verifyGoogleToken: verifyGoogleToken,
    isAdmin: isAdmin
};