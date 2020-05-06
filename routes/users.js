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

router.put('/activation', usersController.reactivateUser) //resend email to activate account
router.get('/activation/:token', usersController.activateUser) //validate activation token
router.get('/email/:token', usersController.changeEmail) //validate token for email reset and update email
router.post('/password/reset', usersController.sendResetPassword) //send email to reset password
router.put('/password/reset', usersController.resetPassword) //reset password with token and new password

router.put('/user/:username/password', auth.verifyToken, usersController.updatePassword) //password update for connected user

module.exports = router
