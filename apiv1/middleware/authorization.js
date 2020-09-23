const {verifyGoogleToken, isAdmin} = require('../authorization/verifyAuth');

const TOKEN_HEADER = 'x-access-token';

const errors = {
    noToken: {
        message: "No token supplied",
        error: "Bad Request"
    },
    invalidToken: {
        message: "Invalid token received",
        error: "Unauthorized"
    }
};

module.exports = {
    requireLogin: async function (req, res, next) {
        let token = req.headers[TOKEN_HEADER];

        if(!token) {
            return res.status(400).json(errors.noToken);
        }
        
        let user = await verifyGoogleToken(token);

        if(!user) {
            return res.status(401).json(errors.invalidToken);
        }

        req.uid = user;
        next();
    },
    requireAdmin: async function(req, res, next) {
        let token = req.headers[TOKEN_HEADER];

        if(!token) {
            return res.status(400).json(errors.noToken);
        }

        let admin = await isAdmin(token);

        if(!admin) {
            return res.status(401).json(errors.invalidToken);
        }

        req.admin = admin;
        next();
    },
    requireAdminOrLogin: async function(req, res, next) {
        let token = req.headers[TOKEN_HEADER];
        if(!token) {
            return res.status(400).json(errors.noToken);
        }

        let admin = await isAdmin(token);
        let user = await verifyGoogleToken(token);
        
        if(!admin && !user) {
            return res.status(401).json(errors.invalidToken);
        }
        req.admin = admin;
        req.uid = user;

        next();
    }
};