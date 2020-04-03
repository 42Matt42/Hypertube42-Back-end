// const User = require('../models/user');

exports.login = ((req, res) => {
    let username = req.query.username;
    let password = req.query.password;
    console.log(username, password)

    if (username && password) {
        console.log("try to login");

        if (username === 'johndoe') {
            if (password === '123456') {



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
    }
    return res.status(400).json({
        error: "Username/password missing",
    });
});

exports.logout = ((req, res) => {
    res.json({
        message: "logout",
    });
});

exports.getUser = ((req, res) => {
    res.json({
        message: "getUser",
        name: req.params.username,
    });
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
    res.json({
        message: "Add new User",
    });
});