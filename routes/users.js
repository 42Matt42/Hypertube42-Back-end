const express = require('express')
const router = express.Router()
const usersController = require('../controllers/users')
const auth = require('../helpers/auth')
const multer = require('multer')
const storage = require('../helpers/multer')
const upload = multer(storage)

router.post('/login', usersController.login)

router.put(
  '/user/:username/email',
  auth.verifyToken,
  usersController.updateEmail
)
router.patch(
  '/user/:username/avatar',
  upload.single('avatar'),
  usersController.updateAvatar
)
router
  .route('/user/:username')
  .get(auth.verifyToken, usersController.getUser)
  .put(auth.verifyToken, usersController.putUser)

router.post('/user', usersController.postUser)

router.put('/activation', usersController.reactivateUser) //send email to activate account again
router.get('/activation/:token', usersController.activateUser) //validate password reset / activation token
router.get('/email/:token', usersController.changeEmail) //validate password reset / activation token
router.post('/user/reset', usersController.sendResetPassword) //send email to reset password

module.exports = router
