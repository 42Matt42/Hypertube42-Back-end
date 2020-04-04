const models = require('../models');

exports.login = ((req, res) => {
    let username = req.query.username;
    let password = req.query.password;
    if (username && password) {
        models.users.findOne({
            where: {
                username,
            }
        })
            .then(user => {
                if (user) {
                    if (user.password === password) {
                        //TODO login
                        return res.status(200).json({
                            status: "Success",
                        });
                    }
                    return res.status(403).json({
                        error: "Provide valid password",
                    });
                }
                return res.status(403).json({
                    error: "Provide valid username",
                });
            })
            .catch(error => {
                console.log(error);
            })
    } else {
        return res.status(400).json({
            error: "Username/password missing",
        });
    }
});

exports.logout = ((req, res) => {
    res.json({
        message: "logout",
    });
});

exports.getUser = ((req, res) => {
    let username = req.params.username;

    if (username) {
        models.users.findOne({
            where: {
                username,
            },
            attributes: {exclude: ['password']}
        })
            .then(user => {
                if (user) {
                    return res.status(200).json({
                        status: "Success",
                        user
                    });
                }
                return res.status(404).json({
                    error: "User not found",
                });
            })
            .catch(error => {
                console.log(error);
            })
    } else {
        return res.status(400).json({
            error: "Username/password missing",
        });
    }
});

exports.putUser = ((req, res) => {
    res.json({
        message: "update User",
        name: req.params.username,
    });
});

exports.deleteUser = ((req, res) => {
    res.json({
        message: "delete User",
        name: req.params.username,
    });
});

exports.postUser = ((req, res) => {
    let {firstName, lastName, email, username, password, photo} = req.query;

    models.users.create({
        firstName, lastName, email, username, password, photo
    })
        .then(user => {
            if (user) {
                return res.status(200).json({
                    status: "Success",
                    "id": user.id
                });
            }
        })
        .catch(error => {
            let errorMessages = [];
            error.errors.forEach((error) => {
                    errorMessages.push(error.message)
                    console.log(error.message)
                }
            )
            return res.status(405).json({
                error: errorMessages
            });
        })
});