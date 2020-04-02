const User = require('../models/user');


exports.login = ((req, res) => {
    res.json({
        message: "login",
        name: req.query.name,
        password: req.query.password,
    })
});

exports.logout = ((req, res) => {
    res.json({
        message: "logout",
    })
});

exports.getUser = ((req, res) => {
    res.json({
        message: "getUser",
        name: req.params.username,
    })
});

exports.putUser = ((req, res) => {
    res.json({
        message: "update User",
        name: req.params.username,
    })
});

exports.deleteUser = ((req, res) => {
    res.json({
        message: "delete User",
        name: req.params.username,
    })
});

exports.postUser = ((req, res) => {
    res.json({
        message: "Add new User",
    })
});