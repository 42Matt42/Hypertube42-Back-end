const express = require('express')
const router = express.Router()
const oauthController = require('../controllers/oauth')

router.get('/42', oauthController.redirect42)
router.get('/fb', oauthController.redirectFacebook)
router.get('/gh', oauthController.redirectGitHub)
router.get('/reddit', oauthController.redirectReddit)

module.exports = router
