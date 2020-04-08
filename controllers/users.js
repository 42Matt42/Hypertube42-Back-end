const models = require('../models');
const errors = require('../helpers/errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const auth = require('../helpers/auth')
const emailHelper = require('../helpers/email')
const moment= require('moment')
const { Sequelize, DataTypes } = require('sequelize');

exports.login = ((req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username && password) {
        models.user.findOne({
            where: {
                username,
            }
        })
            .then(user => {
                if (user) {
                    if (user.disabled) {
                        return res.status(403).json({
                            error: "User is disabled",
                            token: null
                        });
                    }
                    if (bcrypt.compareSync(password, user.password)) {
                        let exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
                        jwt.sign({
                            exp: exp,
                            data: {
                                id: user.id,
                                username: user.username
                            }
                        }, config.jwt, (err, token) => {
                            if (err) {
                                return res.status(500).json({error: 'Failed to create token.'});
                            }
                            return res.status(200).json({
                                status: "Success",
                                token: {
                                    exp,
                                    code: token,
                                },
                            });
                        });
                    } else {
                        return res.status(403).json({
                            error: "Provide valid password",
                            token: null
                        });
                    }
                } else {
                    return res.status(403).json({
                        error: "Provide valid username",
                        token: null
                    });
                }
            })
            .catch(error => {
                console.log(error);
                return res.status(400).json({
                    error: "Database error",
                });
            })
    } else {
        return res.status(400).json({
            error: "Username/password missing",
        });
    }
});

exports.getUser = ((req, res) => {
    let username = req.params.username;

    if (username) {
        models.user.findOne({
            where: {
                username,
            },
            attributes: {exclude: ['password', 'token']}
        })
            .then(user => {
                if (user) {
                    return res.status(200).json({
                        status: "Success",
                        user,
                    });
                }
                return res.status(404).json({
                    error: "User not found",
                });
            })
            .catch(error => {
                console.log(error);
                return res.status(500).json({
                    error: "Database error",
                });
            })
    } else {
        return res.status(400).json({
            error: "Username missing",
        });
    }
});

exports.putUser = ((req, res, next) => {
    let username = req.params.username;
    //TODO handle email update
    if (username) {
        let {firstName, lastName, email, password} = req.body;
        if (username != req.username) {
            return res.status(403).send({error: 'Unauthorized'});
        }
        console.log(firstName, lastName, email, username, password)
        if (password && auth.checkPassword(req, res, next, password)) {
            password = bcrypt.hashSync(password, 8);
        }
        models.user.update({
                firstName, lastName, email, username, password
            }, {
                where: {
                    username
                }
            }
        )
            .then(() => {
                return res.status(200).json({
                    status: "Success",
                });
            })
            .catch(error => {
                console.log(error)
                let errorMessages = errors.getErrors(error)
                return res.status(405).json({
                    error: errorMessages
                });
            })
    } else {
        return res.status(400).json({
            error: "Username missing",
        });
    }
});

exports.postUser = ((req, res, next) => {
    let {firstName, lastName, email, username, password, photo} = req.body;
    if (password && auth.checkPassword(req, res, next, password)) {
        password = bcrypt.hashSync(password, 8);
    }
    models.user.create({
        firstName, lastName, email, username, password, photo
    })
        .then(user => {
            if (user) {
                emailHelper.send(email, username, user.token, emailHelper.templates.ACTIVATE).then(
                    function (result) {
                        if (result) {
                            return res.status(200).json({
                                status: "Success",
                            });
                        } else {
                            return res.status(500).json({error: 'Failed to send email.'})
                        }
                    },
                    function (error) {
                        console.log(error)
                        return res.status(500).json({error: 'Failed to send email.'})
                    }
                )
            }
        })
        .catch(error => {
            // console.log(error)
            let errorMessages = errors.getErrors(error)
            return res.status(405).json({
                error: errorMessages
            });
        })
});


exports.activateUser = ((req, res, next) => {
    let token = req.params.token;
    if (token) {
        models.user.update({
                disabled: 0,
            token: null,
            }, {
                where: {
                    token,
                    token_creation: {
                        [Sequelize.Op.gte]: moment().subtract(10, 'minutes').toISOString()
                    }
                }
            }
        )
            .then(result => {
                console.log(token)
                console.log("res", result)
                if (result == 1) {
                    return res.status(200).json({
                        status: "Success",
                    });
                } else {
                    return res.status(403).json({
                        error: "Token invalid",
                    });
                }
            })
            .catch(error => {
                console.log(error);
                return res.status(400).json({
                    error: "Database error",
                });
            })
    } else{
        return res.status(400).json({
            error: "Token missing",
        });
    }
});