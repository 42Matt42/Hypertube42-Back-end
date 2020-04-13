const request = require('supertest');
const test = require('tape');
const app = require('../app');
const async = require('async');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
const config = require('../config/config');
const models = require('../models');

let exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
const token = () => {
    return jwt.sign({
        exp: exp,
        data: {
            id: 1,
            username: 123
        }
    }, config.jwt, );
}

test('Post valid user', function (t) {
    async.waterfall([
            (cb) =>
                request(app).post('/users/user')
                    .send({
                        username: '123',
                        password: '123123',
                        email: '123@gl.com',
                        firstName: 'first',
                        lastName: 'last'
                    })
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
                request(app).post('/users/user')
                    .send({
                        username: '123',
                        password: '123123',
                        firstName: 'first',
                        lastName: 'last'
                    })
                    .expect('Content-Type', /json/)
                    .expect(405, cb),
            (results, cb) => {
                t.same(results.body.error[0], "Please provide email");
                cb(null, results);
            },
            (results, cb) =>
                request(app).post('/users/user')
                    .send({
                        username: '123',
                        password: '123123',
                        email: '123@gl.com',
                        firstName: 'first',
                    })
                    .expect('Content-Type', /json/)
                    .expect(405, cb),
            (results, cb) => {
                t.same(results.body.error[0], "Please provide last name");
                cb(null, results);
            },
            (results, cb) =>
                request(app).post('/users/user?email=123@gl.com&username=123&firstName=first&lastName=last&password=123123')
                    .send({
                        username: '123',
                        password: '123123',
                        email: '123@gl.com',
                        firstName: 'first',
                        lastName: 'last'
                    })
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
        .set({"x-access-token": token()})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            t.error(err, 'No error');
            t.same(res.body.user.username, "123", "username is valid");
            t.same(res.body.user.email, "123@gl.com", 'User email as expected');
            t.same(res.body.user.firstName, "first", 'Firstname as expected');
            t.same(res.body.user.lastName, "last", 'Lastname as expected');
            t.end();
        });
});

test('Get invalid user', function (t) {
    request(app)
        .get('/users/user/12345')
        .set({"x-access-token": token()})
        .expect('Content-Type', /json/)
        .expect(404)
        .end(function (err, res) {
            t.end(err);
        });

});


test('Activation / login / reset chain valid user', function (t) {
    async.waterfall([
            (cb) =>
                models.user.findOne({
                    where: {
                        username: 123
                    }
                })
                    .then(user => {
                        request(app)
                            .get('/users/activation/' + user.token)
                            .send()
                            .expect('Content-Type', /json/)
                            .expect(200, cb)
                    }),
            (results, cb) => {
                t.same(results.body.status, "Success", "Status: Success 1");
                cb(null, results);
            },
            (results, cb) => {
                request(app)
                    .post('/users/login')
                    .send({
                        username: '123',
                        password: '123123',
                    })
                    .expect('Content-Type', /json/)
                    .expect(200, cb)
            },
            (results, cb) => {
                t.same(results.body.status, "Success", "Status: Success 2");
                cb(null, results);
            },
            (results, cb) => {
                request(app)
                    .post('/users/user/reset')
                    .send({
                        email: '123@gl.com',
                    })
                    .expect('Content-Type', /json/)
                    .expect(200, cb)
            },
            (results, cb) => {
                t.same(results.body.status, "Success", "Status: Success 3");
                cb(null, results);
            },
            (results, cb) => {
                models.user.findOne({
                    where: {
                        username: 123,
                    }
                })
                    .then(user => {
                        t.notEqual(user.token, null, "Token updated successfully");
                        cb(null, results);
                    })
            },
            (results, cb) => {
        console.log(token())
                request(app)
                    .put('/users/user/123/email')
                    .set({"x-access-token": token()})
                    .send({
                        email: '123@gol.com',
                    })
                    .expect('Content-Type', /json/)
                    .expect(200, cb)
            },
            (results, cb) => {
                t.same(results.body.status, "Success", "Status: Success 4");
                cb(null, results);
            },
            (results, cb) => {
                models.tempEmail.findOne({
                    where: {
                        userId: 1,
                    }
                })
                    .then(tempEmail => {
                        t.notEqual(tempEmail.token, null, "Token created successfully");
                        cb(null, tempEmail.token);
                    })
            },
            (results, cb) => {
                request(app)
                    .get('/users/email/' + results)
                    .send()
                    .expect('Content-Type', /json/)
                    .expect(200, cb)
            },
            (results, cb) => {
                t.same(results.body.status, "Success", "Status: Success 5");
                cb(null, results);
            },
            (results, cb) => {
                models.user.findOne({
                    where: {
                        username: 123,
                    }
                })
                    .then(user => {
                        t.same(user.email, '123@gol.com', "Email updated successfully");
                        cb(null, results);
                    })
            },
            (results, cb) => {
                models.tempEmail.findOne({
                    where: {
                        userId: 1,
                    }
                })
                    .then(user => {
                        t.same(user, null, "Temp email deleted successfully");
                        cb(null, results);
                    })
            },
        ],
        (err, results) => {
            t.end();
        }
    );
});


test('Login invalid', function (t) {
    request(app)
        .post('/users/login')
        .send({
            username: '123',
            password: '12312',
        })
        .expect('Content-Type', /json/)
        .expect(403)
        .end(function (err, res) {
            t.end(err);
        });
});

test('Put valid', function (t) {
    request(app)
        .post('/users/login')
        .set({"x-access-token": token()})
        .send({
            username: '123',
            password: '123123',
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            t.error(err, 'No error');
            t.end();
        });
});