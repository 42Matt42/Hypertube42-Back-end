const models = require('../models');
const errors = require('../helpers/errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const auth = require('../helpers/auth')
const emailHelper = require('../helpers/email')
const moment = require('moment')
const {Sequelize, sequelize} = require('sequelize');
const {v4: uuidv4} = require('uuid');
const db = require('../models/index')

exports.login = ((req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username/password missing",
        });
    }

    models.user.findOne({where: {username,}})
        .then(user => {
            if (!user || (!bcrypt.compareSync(password, user.password))) {
                return res.status(403).json({
                    error: "Username or password incorrect",
                    token: null
                });
            }
            if (user.disabled) {
                return res.status(403).json({
                    error: "User is disabled",
                    token: null
                });
            }
            let exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
            jwt.sign({
                exp: exp,
                data: {
                    id: user.id,
                    username: user.username
                }
            }, config.jwt, (err, token) => {
                if (err) {
                    return res.status(500).json({error: "Failed to create token."});
                }
                return res.status(200).json({
                    status: "Success",
                    token: {
                        exp,
                        code: token,
                    },
                });
            });
        })
        .catch(error => {
            console.log(error);
            return res.status(400).json({
                error: "Database error",
            });
        })
});

exports.getUser = ((req, res) => {
    let username = req.params.username;
    models.user.findOne({
        where: {
            username,
        },
        attributes: {exclude: ['password', 'token']}
    })
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    error: "User not found",
                });
            }
            return res.status(200).json({
                status: "Success",
                user,
            });
        })
        .catch(error => {
            console.log(error);
            return res.status(500).json({
                error: "Database error",
            });
        })
});


exports.updateEmail = ((req, res, next) => {
    let username = req.params.username;
    let email = req.body.email;

   // check if email already exists
    if (!email) {
        return res.status(400).json({
            error: "Email missing",
        });
    }
    if (username.toString() !== req.username.toString()) {
        console.log("not same user", username, req.username);
        return res.status(403).send({error: 'Unauthorized'});
    }
    models.user.findOne({where: {email,}})
        .then(user => {
            if (user) {
                if (user.username === req.username) {
                    return res.status(200).json({
                        status: "Success",
                        message: "Same email"
                    });
                }
                return res.status(404).json({
                    error: "Email already in use",
                });
            } else {
                let token = uuidv4();
                let token_creation = moment().toISOString();
                models.tempEmail.upsert({
                    email,
                    token_creation,
                    token,
                    userId: req.userId,
                })
                    .then(() => {
                        console.log(email, req.username, token)
                        emailHelper.send(email, req.username, token, emailHelper.templates.CHANGEEMAIL).then(
                            function (result) {
                                if (result) {
                                    return res.status(200).json({
                                        status: "Success",
                                        message: "Email sent"
                                    });
                                }
                                return res.status(500).json({error: 'Failed to send email.'})
                            },
                            function (error) {
                                console.log(error)
                                return res.status(500).json({error: 'Failed to send email.'})
                            })
                    })
                    .catch(error => {
                        console.log(error);
                        return res.status(400).json({error: "Database error",});
                    })
            }
        })
        .catch(error => {
            console.log(error)
            let errorMessages = errors.getErrors(error)
            return res.status(405).json({
                error: errorMessages
            });
        })
});

exports.putUser = ((req, res, next) => {
    //todo send token if username updated?
    let currentUsername = req.params.username;
    let {firstName, lastName, language, username} = req.body;
    if (currentUsername !== req.username) {
        console.log(currentUsername, req.username);
        return res.status(403).send({error: 'Unauthorized'});
    }
    // if (password && auth.checkPassword(req, res, next, password)) {
    //     password = bcrypt.hashSync(password, 8);
    // }

    models.user.update({
        firstName, lastName, username, language
    }, {
        where: {
                username: currentUsername,
                disabled: 0
            }
    })
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
                        }
                        return res.status(500).json({error: 'Failed to send email.'})
                    },
                    function (error) {
                        console.log(error)
                        return res.status(500).json({error: 'Failed to send email.'})
                    })
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


exports.activateUser = ((req, res) => {
    let token = req.params.token;
    models.user.update({
        disabled: 0,
        token: null,
    }, {
        where: {
            token,
            token_creation: {[Sequelize.Op.gte]: moment().subtract(10, 'minutes').toISOString()}
        }
    })
        .then(result => {
            if (result == 1) {
                return res.status(200).json({status: "Success"});
            }
            return res.status(403).json({error: "Token invalid"});
        })
        .catch(error => {
            console.log(error);
            return res.status(400).json({error: "Database error",});
        })
});

exports.changeEmail = ((req, res) => {
    let token = req.params.token;

    models.tempEmail.findOne({
        where: {
            token,
            token_creation: {[Sequelize.Op.gte]: moment().subtract(10, 'minutes').toISOString()}
        },
        attributes: {exclude: ['password', 'token']}
    })
        .then(tempEmail => {
            // console.log(tempEmail)
            if (!tempEmail) {
                return res.status(404).json({
                    error: "Token invalid",
                });
            }
            models.user.update({
                email: tempEmail.email
            }, {
                where: {
                    id: tempEmail.userId
                }
            })
                .then(result => {
                    if (result == 1) {
                        tempEmail.destroy()
                        return res.status(200).json({status: "Success"});
                    }
                    return res.status(403).json({error: "Token invalid"});
                })
                .catch(error => {
                    console.log(error);
                    return res.status(400).json({error: "Database error",});
                })
        })
        .catch(error => {
            console.log(error);
            return res.status(500).json({
                error: "Database error",
            });
        })


});

exports.reactivateUser = ((req, res, next) => {
    sendEmail(req, res, next, emailHelper.templates.ACTIVATE);
});

exports.sendResetPassword = ((req, res, next) => {
    sendEmail(req, res, next, emailHelper.templates.RESET);
});

sendEmail = ((req, res, next, template) => {
    let email = req.body.email;
    let token = uuidv4();
    let token_creation = moment().toISOString();
    if (!email) {
        return res.status(400).json({
            error: "Email missing",
        });
    }

    models.user.findOne({where: {email}})
        .then(user => {
            if (!user) {
                return res.status(400).json({error: "Email doesn't exist"});
            }
            if (template === emailHelper.templates.ACTIVATE && !user.disabled) {
                return res.status(409).json({error: "Account already enabled"});
            } else if (template === emailHelper.templates.RESET && user.disabled) {
                return res.status(409).json({error: "Account is disabled"});
            }
            models.user.update({
                token,
                token_creation,
            }, {where: {email}})
                .spread((affectedCount, affectedRows) => {
                    console.log(affectedCount, affectedRows);
                    if (affectedCount !== 1) {
                        return res.status(400).json({error: "Database error"});
                    }
                    emailHelper.send(email, user.username, token, template).then(
                        function (result) {
                            if (result) {
                                return res.status(200).json({
                                    status: "Success",
                                });
                            }
                            return res.status(500).json({error: "Failed to send email"})
                        },
                        function (error) {
                            console.log(error)
                            return res.status(500).json({error: "Failed to send email"})
                        })
                })
                .catch(error => {
                    console.log(error);
                    return res.status(400).json({
                        error: "Database error",
                    });
                })
        })
        .catch(error => {
            console.log(error);
            return res.status(400).json({
                error: "Database error",
            });
        })
});