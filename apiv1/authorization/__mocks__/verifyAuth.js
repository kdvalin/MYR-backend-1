const verify = jest.genMockFromModule("../verifyAuth");
const ObjId = require("mongoose").Types.ObjectId;

const TOKEN_HEADER = "x-access-token";

const userTokens = {
    "r1squCvH0uTbobuoTV9G": ObjId("5ece88ff0d947fc9d912a437"), //test@example.com
    "xlhxDVnoUmRl8UltLdHo": ObjId("5ece8ace0d947fc9d912a438") //gordon@example.com
};

async function verifyGoogleToken (token) {
    if(userTokens[token]){
        return userTokens[token];
    }
    return false;
}

//Needs to be here since we're using a mock impelmentation of verifyGoogleToken
async function requireLogin(req, res, next) {
    let token = req.headers[TOKEN_HEADER];

    if(!token) {
        return res.status(400).json({
            message: "No token supplied",
            error: "Bad Request"
        });
    }
    
    let user = await verifyGoogleToken(token);

    if(!user) {
        return res.status(401).json({
            message: "Invalid token received",
            error: "Unauthorized"
        });
    }

    req.uid = user;
    next();
}

verify.verifyGoogleToken = verifyGoogleToken;
verify.requireLogin = requireLogin;

module.exports = verify;