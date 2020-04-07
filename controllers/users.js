const models = require('../models');
const errors = require('../helpers/errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

exports.login = ((req, res) => {
    let username = req.query.username;
    let password = req.query.password;
    if (username && password) {
        models.user.findOne({
            where: {
                username,
            }
        })
            .then(user => {
                if (user) {
                    if (bcrypt.compareSync(password, user.password)) {
                        console.log(user.id, user.username)

                        jwt.sign({ id: user.id, username: user.username }, config.jwt, {
                            expiresIn: 86400 }, (err, token) => {
                            if (err)
                                return res.status(500).json({ error: 'Failed to create token.' });

                            return res.status(200).json({
                                status: "Success",
                                token,
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
            attributes: {exclude: ['password']}
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

exports.putUser = ((req, res) => {
    res.json({
        message: "update User",
        name: req.params.username,
    });
});

exports.postUser = ((req, res) => {
    let {firstName, lastName, email, username, password, photo} = req.query;
    let hashedPassword;
    if (password) {
        if (password.length > 15 || password.length < 6) {
            return res.status(405).json({
                error: "Password should contain between 6 and 15 characters"
            });
        }
        hashedPassword = bcrypt.hashSync(password, 8);
    }
    models.user.create({
        firstName, lastName, email, username, password:hashedPassword, photo
    })
        .then(user => {
            if (user) {
                jwt.sign({ id: user.id, username: user.username }, config.jwt, {
                    expiresIn: 86400 }, (err, token) => {
                    if (err)
                        return res.status(500).json({ error: 'Failed to create token.' });
                    return res.status(200).json({
                        status: "Success",
                        token,
                    });
                });
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