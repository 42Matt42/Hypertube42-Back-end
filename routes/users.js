const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users')

router.get('/login', usersController.login);

router.get('/logout', usersController.logout);

router.route('/user/:username')
    .get(usersController.getUser)
    .put(usersController.putUser)
    .delete(usersController.deleteUser);

router.post('/user', usersController.postUser);

module.exports = router;