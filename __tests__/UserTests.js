const request = require('supertest');
const app = require('./../app');
const assert = require('assert');

describe('Test the users get path without token', () => {
    test('It should respond with HTTP status 400', () => {
        return request(app).get('/apiv1/users/')
            .expect(400);
    });
});

describe('Test admin user login', () => {
    test('It should respond with 200', () => {
        return request(app).post('/apiv1/users/login')
            .send({ email: 'test_db@learnmyr.org', password: 'testing123' })
            .expect(200)
            .then(response => {
                assert(response.body.auth === true);
                assert(response.body.isAdmin === true);
                assert(response.body.token != null);
            });
    });
});

describe('Test non-admin user login', () => {
    test('It should respond with 200', () => {
        return request(app).post('/apiv1/users/login')
            .send({ email: 'test_db_na@learnmyr.org', password: 'testing321' })
            .expect(200)
            .then(response => {
                assert(response.body.auth === true);
                assert(response.body.isAdmin === false);
                assert(response.body.token != null);
            });
    });
});

describe('Test user  with bad password', () => {
    test('It should respond with 401', () => {
        return request(app).post('/apiv1/users/login')
            .send({ email: 'test_db@learnmyr.org', password: 'testing' })
            .expect(401);
    });
});

describe('Test user  with bad email', () => {
    test('It should respond with 401', () => {
        return request(app).post('/apiv1/users/login')
            .send({ email: 'mwahaha@learnmyr.org', password: 'testing' })
            .expect(401);
    });
});

describe('Test logout', () => {
    test('It should respond with 200', () => {
        return request(app).get('/apiv1/users/logout')
            .expect(200)
            .then(response => {
                assert(response.body.auth === false);
                assert(response.body.token == null);
            });
    });
});