const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users')
const verifyToken = require('../helpers/auth')

router.post('/login', usersController.login);

// router.get('/logout', usersController.logout);

router.route('/user/:username')
    .get(verifyToken, usersController.getUser)
    .put(verifyToken, usersController.putUser)


router.post('/user', usersController.postUser);

module.exports = router;