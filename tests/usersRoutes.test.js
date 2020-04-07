const request = require('supertest');
const test = require('tape');
const app = require('../app');
const async = require('async');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
const config = require('../config/config');

// test('Login endpoint', function (t) {
//     request(app)
//         .get('/users/login')
//         .expect('Content-Type', /json/)
//         .expect(200)
//         .end(function (err, res) {
//             t.error(err, 'No error');
//             t.end();
//         });
// });

let token = jwt.sign({ id: 1, username: 123 }, config.jwt, {
    expiresIn: 86400 // expires in 24 hours
});

test('Post valid user', function (t) {
    async.waterfall([
            (cb) =>
                request(app).post('/users/user?email=123@gmail.com&username=123&firstName=first&lastName=last&password=123123')
                    .expect('Content-Type', /json/)
                    .expect(200, cb),
            (results, cb) => {
                t.same(results.body.status, "Success", "Status: Success");
                cb(null, results);
            },
        ],
        (err, results) => {
            t.end();
        }
    );
});


test('Post invalid user', function (t) {
    async.waterfall([
            (cb) =>
                request(app).post('/users/user/?email=123@g.om&username=123&firstName=first&lastName=last')
                    .expect('Content-Type', /json/)
                    .expect(405, cb),
            (results, cb) => {
                t.same(results.body.error[0], "Please provide email");
                cb(null, results);
            },
            (results, cb) =>
                request(app).post('/users/user/?email=123@g.om&username=123&firstName=first&password=123123')
                    .expect('Content-Type', /json/)
                    .expect(405, cb),
            (results, cb) => {
                t.same(results.body.error[0], "Please provide last name");
                cb(null, results);
            },
            (results, cb) =>
                request(app).post('/users/user?email=123@gmail.com&username=123&firstName=first&lastName=last&password=123123')
                    .expect('Content-Type', /json/)
                    .expect(405, cb),
        (results, cb) => {
            t.same(results.body.error[0], "email must be unique");
            cb(null, results);
        },
        ],
        (err, results) => {
            t.end();
        }
    );

});

test('Get valid user', function (t) {
    request(app)
        .get('/users/user/123')
        .set({"x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiIxMjMiLCJpYXQiOjE1ODYyNDc3MzYsImV4cCI6MTU4NjMzNDEzNn0.fL-nADeWgB23gCGTPiTQE5OOikCdaQwaQuEaqHCXT5c"})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            t.error(err, 'No error');
            t.same(res.body.user.username, "123", token);
            t.same(res.body.user.email, "123@gmail.com", 'User email as expected');
            t.same(res.body.user.firstName, "first", 'Firstname as expected');
            t.same(res.body.user.lastName, "last", 'Lastname as expected');
            t.end();
        });
});

test('Get invalid user', function (t) {
    request(app)
        .get('/users/user/12345')
        .set({"x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiIxMjMiLCJpYXQiOjE1ODYyNDc3MzYsImV4cCI6MTU4NjMzNDEzNn0.fL-nADeWgB23gCGTPiTQE5OOikCdaQwaQuEaqHCXT5c"})
        .expect('Content-Type', /json/)
        .expect(404)
        .end(function(err, res) {
            t.end(err);
        });

});