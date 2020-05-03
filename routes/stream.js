const express = require('express')
const router = express.Router()
const streamController = require('../controllers/stream')

router.get('/Parse', streamController.parse)

module.exports = router
