const request = require('supertest');
const test = require('tape');
const app = require('../app');

test('Login endpoint', function (t) {
    request(app)
        .get('/users/login')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            t.error(err, 'No error');
            t.end();
        });
});

test('Get user', function (t) {
    request(app)
        .get('/users/user/johndoe')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            t.error(err, 'No error');
            t.same(res.body.name, "johndoe", 'Users as expected');
            t.end();
        });
});