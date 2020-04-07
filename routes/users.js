const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users')
const auth = require('../helpers/auth')

router.post('/login', usersController.login);

// router.get('/logout', usersController.logout);

router.route('/user/:username')
    .get(auth.verifyToken, usersController.getUser)
    .put(auth.verifyToken, usersController.putUser)


router.post('/user', usersController.postUser);

module.exports = router;