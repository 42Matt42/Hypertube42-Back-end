const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users')
const auth = require('../helpers/auth')

router.post('/login', usersController.login);

router.route('/user/:username')
    .get(usersController.getUser)
    .put(auth.verifyToken, usersController.putUser)


router.post('/user', usersController.postUser);
router.get('/activation/:token', usersController.activateUser);

module.exports = router;