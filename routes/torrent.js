const express = require('express')
const router = express.Router()
const torrentController = require('../controllers/torrent')

router.get('/movie/:hash', torrentController.getMovie) // Get movie based on magnet hash
//router.get('/subtitles/:hash', torrentController.getSubtitles) // download subs for movie with hash

module.exports = router
