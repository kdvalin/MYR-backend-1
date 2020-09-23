const request = require('supertest');
const app = require('../app');
const assert = require('assert');

const notifEndpoint = "/apiv1/notifications";


function notifIsEqual(first, recv){
    let props1 = Object.getOwnPropertyNames(first);

    props1.forEach(propName => {
        if(propName.indexOf("Time") > 0){
            assert(first[propName] === Date.parse(recv[propName]), 
            `[${propName}] is not equal! 
            ${first[propName]} !== ${Date.parse(recv[propName])}\n`);
        }else if(propName !== "_id"){
            assert(first[propName] === recv[propName], 
                `[${propName}] is not equal! 
                ${first[propName]} !== ${recv[propName]}\n`);
        }
    });
    return true;
}

let minNotif = {
    message: "bobross",
    endTime: Date.now() + 24*60*60*1000
};

let fullNotif = {
    title: "thing",
    message: "bobross",
    color: "#0000FF",
    fontColor: "#000000",
    link: "https://learnmyr.org",
    linkText: "MYR",
    startTime: Date.now(),
    endTime: Date.now() + 24*60*60*1000
};

//Missing message and endTime
const badNotif = {
    title: "Test",
    color: "#0000FF",
    fontColor: "#000000",
    link: "https://learnmyr.org",
    linkButtonText: "MYR",
    startTime: Date.now()
};

let token = {
    "x-access-token": ""
};

describe('Posting Notifications', () => {
    test('Without an admin token, response should be 400', () => {
        return request(app).post(notifEndpoint).send(minNotif).expect(400);
    });
    test('Without a proper body, it should return 400', () => {
        return request(app).post("/apiv1/users/login").send({
            email: "test_db@learnmyr.org",
            password: "testing123"
        }).expect(200).then((resp) => {
            token["x-access-token"] = resp.body.token;

            //Test a notif without an endTime
            let testNotif = badNotif;
            testNotif.message = "bobross";
            request(app).post(notifEndpoint).send(testNotif).set(token).expect(400);

            //Test a notif without a message
            delete testNotif.message;
            testNotif.endTime = Date.now() + 24*60*60*1000;
            return request(app).post(notifEndpoint).send(testNotif).set(token).expect(400);          
        });
    });

    test('A request with a proper body and a admin token should return 201', async () => {
        let minResp = await request(app).post(notifEndpoint).set(token).send(minNotif).expect(201);
        minNotif._id = minResp.body._id;

        let fullResp = await request(app).post(notifEndpoint).set(token).send(fullNotif).expect(201);
        fullNotif._id = fullResp.body._id;
    });
});

describe('Fetching notifications', () => {
    test('GETing notifications from "/" endpoint should all be active', () => {
        return request(app).get(notifEndpoint).expect(200).then((resp) => {
            const notifs = resp.body;

            notifs.forEach(notif => {
                assert(Date.parse(notif.startTime) <= Date.now() && Date.parse(notif.endTime) > Date.now(), 
                    `Notification ${notif._id} is not within date (${notif.startTime} - ${notif.endTime})`);
            });
        });
    });
    test('GETing a notification from id should return 200', () => {
        request(app).get(`${notifEndpoint}/id/${minNotif._id}`).expect(200).then(resp => {
            return notifIsEqual(minNotif, resp.body);
        });
        return request(app).get(`${notifEndpoint}/id/${fullNotif._id}`).expect(200).then(resp => {
            return notifIsEqual(fullNotif, resp.body);
        });
    });
    test('GETing a notification with an invalid ID should return 404', () => {
        return request(app).get(`${notifEndpoint}/id/bobross`).expect(404);
    });
});

describe("Updating notifications", () => {
    test("Updating a notification without a admin token should return 401", () => {
        return request(app).put(`${notifEndpoint}/id/${minNotif._id}`).send(fullNotif).expect(401);
    });
    test("Updating a notification without proper fields should return 400", () => {
        return request(app).put(`${notifEndpoint}/id/${minNotif._id}`).set(token).send(badNotif).expect(400);
    });
    test("Updating a non-existent notification should return 404", () => {
        return request(app).put(`${notifEndpoint}/id/bobross`).set(token).send(fullNotif).expect(404);
    });
    test("Updating a notifcation with all required fields and a valid token should return 204", () => {
        minNotif.message = "Bananas";
        return request(app).put(`${notifEndpoint}/id/${minNotif._id}`).set(token).send(minNotif).expect(204).then(() => {
            return request(app).get(`${notifEndpoint}/id/${minNotif._id}`).expect(200).then(resp => {
                return notifIsEqual(minNotif, resp.body);
            });
        });
    });
});

describe("Deleting Notifications", () => {
    test("Deleting a notification without an admin token should return 401", () => {
        return request(app).delete(`${notifEndpoint}/id/${minNotif._id}`).expect(401);
    });
    test("Deleting a non-existent notification should return 404", () => {
        return request(app).delete(`${notifEndpoint}/id/bobross`).set(token).expect(404);
    });
    test("Delteting a valid notification with an admin token should return 204", () => {
        return request(app).delete(`${notifEndpoint}/id/${minNotif._id}`).set(token).expect(204).then(() => {
            return request(app).get(`${notifEndpoint}/id/${minNotif._id}`).expect(404);
        });
    });
});