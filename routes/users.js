const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const auth = require('../helpers/auth');

router.post('/login', usersController.login);

router.route('/user/:username')
    .get(usersController.getUser)
    .put(auth.verifyToken, usersController.putUser);


router.post('/user', usersController.postUser);

router.put('/activation', usersController.reactivateUser); //send email to activate email again
router.get('/activation/:param', usersController.activateUser); //validate password reset / activation token

router.post('/user/reset', usersController.sendResetPassword);//send email to reset password

module.exports = router;