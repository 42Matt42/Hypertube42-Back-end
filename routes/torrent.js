const express = require('express')
const router = express.Router()
const torrentController = require('../controllers/torrent')

router.get('/movie/:hash/:quality', torrentController.getMovie) // Get movie based on magnet hash at selected quality
//router.get('/subtitles/:hash', torrentController.getSubtitles) // download subs for movie with hash

module.exports = router
