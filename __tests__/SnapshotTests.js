const request = require('supertest');
const app = require('./../app');
const assert = require('assert');

describe('Test the snapshot get path without token', () => {
    test('It should respond with HTTP status 400', () => {
        return request(app).get('/apiv1/snapshots/').expect(400);
    });
});