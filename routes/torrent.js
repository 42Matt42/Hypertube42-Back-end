const express = require('express')
const router = express.Router()
const torrentController = require('../controllers/torrent')

router.get('/:hash', torrentController.getMovie) // Get movie based on magnet hash

module.exports = router
