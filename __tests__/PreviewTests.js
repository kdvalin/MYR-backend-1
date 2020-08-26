const request = require('supertest');
const app = require('../app');
const assert = require('assert');
const fs = require('fs');

const previewRef = "/apiv1/preview/id";
const sceneID = "5de934ec824a0a4598aa1fed";
const altSceneID = "5de93a961466c65b7fda92dc";
const garbageID = "444444444444444444444444";
const validHeaders = {"x-access-token": "r1squCvH0uTbobuoTV9G"};

const image_orig = `${__dirname}/img.jpeg`;
const image = fs.readFileSync(image_orig).toString("base64");
const invalid_image = fs.readFileSync(`${__dirname}/hi.jpeg`).toString("base64");

const testFile = "/tmp/test.jpg";

jest.mock("../apiv1/authorization/verifyAuth");

describe("Creating a preview image", () =>{
   test("Creating an image without a user ID should return 401", () =>{
        return request(app).post(`${previewRef}/${sceneID}`).send({
            data: image
        }).expect(401);
   });

   test("Creating an image with a invalid file should return 400", () => {
        return request(app).post(`${previewRef}/${sceneID}`).set(validHeaders).
            send({
                data: invalid_image
            }).expect(400);
   });
   test("Creating an image without provdining an image should return 400", () => {
       return request(app).post(`${previewRef}/${sceneID}`).set(validHeaders).expect(400);
   });
   test("Creating an image with the wrong user ID should return 401", () =>{
       return request(app).post(`${previewRef}/${sceneID}`).set({"x-access-token": "nope"}).send({
           data: image
       }).expect(401);
   });
   test("Creating an image without an existing scene should return 404", () =>{
        return request(app).post(`${previewRef}/${garbageID}`).set(validHeaders).send({
            data: image
        }).expect(404);
   });
   test("Creating an image with everything valid should return 201", ()=> {
       return request(app).post(`${previewRef}/${sceneID}`).set(validHeaders).send({
           data: image
       }).expect(201);
   });
   test("Creating an image with an existing preview image should return 409", () => {
        return request(app).post(`${previewRef}/${sceneID}`).set(validHeaders).send({
            data: image
        }).expect(409);
   });
});

describe("Updating a preview image", () => {
    test("Updating an image without a user ID should return 401", () =>{
        return request(app).put(`${previewRef}/${sceneID}`).send({
            data: image
        }).expect(401);
   });

   test("Updating an image with a invalid file should return 400", () => {
        return request(app).put(`${previewRef}/${sceneID}`).set(validHeaders).send({
            data: invalid_image
        }).expect(400);
   });
   test("Updating an image without sending data should return 400", () => {
       return request(app).put(`${previewRef}/${sceneID}`).set(validHeaders).expect(400);
   });
   test("Updating an image with the wrong user ID should return 401", () =>{
       return request(app).put(`${previewRef}/${sceneID}`).set({"x-access-token": "nope"}).send({
           data: image
       }).expect(401);
   });
   test("Updating an image without an existing scene should return 404", () =>{
        return request(app).put(`${previewRef}/${garbageID}`).set(validHeaders).send({
            data: image
        }).expect(404);
   });
   test("Updating an image with everything valid should return 204", ()=> {
       return request(app).put(`${previewRef}/${sceneID}`).send({
           data: image
       }).set(validHeaders).expect(204);
   });
   test("Updating an image without an existing preview image should return 404", () => {
        return request(app).put(`${previewRef}/${altSceneID}`).set(validHeaders).send({
            data: image
        }).expect(404);
   });
});
describe("Getting a preview image", () =>{
    test("Requesting a scene with no image should return 404", () => {
        return request(app).get(`${previewRef}/${altSceneID}`).expect(404);
    });
    test("Requesting a scene with an image should return its image", () => {
        return new Promise((resolve, reject) => {
            let img = fs.createWriteStream(testFile);
            let resp = request(app).get(`${previewRef}/${sceneID}`).expect(200);
            resp.pipe(img);

            img.on("close", () => {
                let orig = fs.readFileSync(image_orig);
                let rec = fs.readFileSync(testFile);

                assert(orig.equals(rec), "Image recieved from API does not match original!");
                fs.unlinkSync(testFile);
                resolve(0);
            });
        });
    });
});

describe("Deleting a preview image", () => {
    test("Deleting an image without a user ID should return 401", () =>{
        return request(app).delete(`${previewRef}/${sceneID}`).expect(401);
   });
   test("Deleting an image without an existing scene should return 404", () =>{
        return request(app).delete(`${previewRef}/${garbageID}`).set(validHeaders).expect(404);
    });
    test("Deleting an image with the wrong user ID should return 401", () =>{
        return request(app).delete(`${previewRef}/${sceneID}`).set({"x-access-token": "nope"}).expect(401);
    });
    test("Deleting an image with everything valid should return 204", () => {
        return request(app).delete(`${previewRef}/${sceneID}`).set(validHeaders).expect(204).then(() =>{
            return request(app).delete(`${previewRef}/${sceneID}`).set(validHeaders).expect(404);
        });
    });
});