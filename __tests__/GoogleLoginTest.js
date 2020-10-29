const request = require('supertest');
const app = require('./../app');

jest.mock("../apiv1/authorization/verifyAuth");

const googleLoginRef = "/apiv1/googlelogins/"
const loginRef = "/apiv1/users/login/";
const adminInfo = {
    email:"test_db@learnmyr.org",
    password:"testing123"
};
const userInfo = {
    email:"test_db_na@learnmyr.org",
    password: "testing321"
};

describe("Testing to get a list of google login", () => {
    test("Empty token should respond with HTTP status 400", () => {
        return request(app).get(googleLoginRef)
            .expect(400);
    });
    test("Request with non-admin info should respond with HTTP status 401", () => {
        return request(app).post(loginRef).send(userInfo)
        .expect(200).then((resp)=>{
            let token = {"x-access-token":resp.body.token};
            return request(app).get(googleLoginRef).set(token).expect(401);
        });
    });
    test("Request with proper admin info should respond with HTTP status 200", () => {
        return request(app).post(loginRef).send(adminInfo)
        .expect(200).then((resp)=>{
            let token = {"x-access-token":resp.body.token};
            request(app).get(googleLoginRef).set(token).expect(200);
        });
    }); 
});

describe("Testing to get a sepecific google login", () => {
    test("Supplying ID without admin info will respond with HTTP status 400", () => {
        return request(app).get(`${googleLoginRef}/id/5ece88ff0d947fc9d912a437`)
            .expect(400);
    });
    test("Request with non-admin should respond with HTTP status 401", () => {
        return request(app).post(loginRef).send(userInfo)
        .expect(200).then((res)=>{
            console.log(res.body.token);
            return request(app).get(`${googleLoginRef}/id/5ece88ff0d947fc9d912a437`).set({"x-access-token":res.body.token}).expect(401);
        });
    });
    test("Request with proper admin info should respond with HTTP status 200", () => {
        return request(app).post(loginRef).send(adminInfo)
        .expect(200).then((resp)=>{
            request(app).get(`${googleLoginRef}/id/5ece88ff0d947fc9d912a437`).expect(200);
        });
    });
});