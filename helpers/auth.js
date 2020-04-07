var jwt = require('jsonwebtoken');
var config = require('../config/config');

exports.verifyToken = (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwt, function(err, decoded) {
        if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

        // if everything good, save to request for use in other routes
        req.userId = decoded.id;
        next();
    });
}

exports.checkPassword = (req, res, next, password) => {
    if (password.length > 15 || password.length < 6) {
        return res.status(405).json({
            error: "Password should contain between 6 and 15 characters"
        });
    }
    return true;
}

// module.exports = verifyToken;
