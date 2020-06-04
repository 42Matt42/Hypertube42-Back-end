const models = require('../models')
const { Op } = require('sequelize')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const torrentStream = require('torrent-stream')
const pump = require('pump')
const ffmpeg = require('fluent-ffmpeg')

const movie_path = './movies/'
const tracker_list = [
  'udp://tracker.openbittorrent.com:80',
  'udp://9.rarbg.to:2790/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.sktorrent.net:6969/announce',
  'https://tracker.bt-hash.com:443/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://glotorrents.pw:6969/announce',
  'udp://torrent.gresille.org:80/announce',
  'udp://p4p.arenabg.com:1337',
  'udp://tracker.leechers-paradise.org:6969',
]

async function cleanup_movies() {
  //finds and removes any >30 days movies
  let now = new Date()
  now.setDate(now.getDate() - 30)
  models.film
    .findAll({
      where: { viewed: { [Op.lte]: now } },
    })
    .then(function (movies) {
      movies.forEach((element) => {
        fs.unlinkSync(element.dataValues.path)
        models.film.destroy({ where: { id: element.dataValues.id } })
      })
    })
}

async function upsert_movie(values, condition) {
  return models.film
    .findOne({ where: condition })
    .then(function (obj) {
      if (obj) {
        return obj.update(values)
      }
      //Fallback if not found.
      return models.film.create(values)
    })
    .catch(function (err) {
      //console.log(err, values)
    })
}

function streamMovie(res, file, start, end, mimetype) {
  res.writeHead(200, {
    'Content-Length': file.length,
    'Content-Type': mimetype,
    'Cache-Control': 'no-store',
  })
  let stream = file.createReadStream({
    start: start,
    end: end,
  })
  if (
    mimetype === 'video/mp4' ||
    mimetype === 'video/ogg' ||
    mimetype === 'video/webm'
  ) {
    console.log('Sending Raw file to stream')
    pump(stream, res)
  } else {
    let command = ffmpeg(stream)
      .videoCodec('libvpx')
      .audioCodec('libvorbis')
      .format('webm')
      .audioBitrate(128)
      .videoBitrate(1024)
      .outputOptions(['-deadline realtime', '-error-resilient 1'])
      .on('start', function (cmd) {
        console.log(cmd)
      })
      .on('error', function (err) {
        //console.log(err)
      })
    pump(command, res)
  }
}

function localfilestream(res, filepath, start, end, mimetype, size) {
  //For on the fly conversion of saved movie, when played from a file
  res.writeHead(200, {
    'Content-Length': size,
    'Content-Type': mimetype,
    'Cache-Control': 'no-store',
  })
  let stream = fs.createReadStream(filepath, {
    start: start,
    end: end,
  })
  if (
    mimetype === 'video/mp4' ||
    mimetype === 'video/ogg' ||
    mimetype === 'video/webm'
  ) {
    console.log('Sending Raw file to stream')
    pump(stream, res)
  } else {
    let command = ffmpeg(stream)
      .videoCodec('libvpx')
      .audioCodec('libvorbis')
      .format('webm')
      .audioBitrate(128)
      .videoBitrate(1024)
      .outputOptions(['-deadline realtime', '-error-resilient 1'])
      .on('start', function (cmd) {
        console.log(cmd)
      })
      .on('error', function (err) {
        //console.log(err)
      })
    pump(command, res)
  }
}

exports.getMovie = async (req, res, next) => {
  if (req.params.hash.length < 32) {
    res.status(400).json({
      error: 'invalid hash',
    })
    return
  }
  try {
    cleanup_movies()
    let hash = req.params.hash
    let filmref = parseInt(req.query.id, 10)
    let basedir = movie_path + hash.substring(0, 10)
    let magnet = `magnet:?xt=urn:btih:${hash}`
    let filepath = ''
    const movie = await models.film.findOne({ where: { magnet: hash } })
    if (movie !== null) {
      filepath = movie.path
    }
    fs.access(filepath, fs.F_OK, (notfound) => {
      if (notfound) {
        console.log('starting torrent')
        const engine = torrentStream(magnet, {
          connections: 100,
          uploads: 10,
          path: basedir,
          verify: true,
          trackers: tracker_list,
        })
        let fileName = null
        let fileExt = null
        let fileSize = null
        engine.on('ready', () => {
          engine.files.forEach((file) => {
            if (
              path.extname(file.name) !== '.mp4' &&
              path.extname(file.name) !== '.avi' &&
              path.extname(file.name) !== '.ogg' &&
              path.extname(file.name) !== '.mkv' &&
              path.extname(file.name) !== '.webm'
            ) {
              file.deselect()
              return
            }
            let mimetype = mime.lookup(file.name)
            let mimeVideo = mimetype.split('/')[0]
            if (mimeVideo === 'video') {
              file.select()
            }
            fileSize = file.length
            let start = 0
            let end = fileSize - 1
            fileName = file.path.replace(path.extname(file.name), '')
            fileExt = path.extname(file.name)
            console.log(
              `[FROM TORRENT] selected ${fileName}${fileExt} Size: ${fileSize}`
            )
            streamMovie(res, file, start, end, mimetype)
          })
        })
        engine.on('download', () => {
          //Feedback only
          const progress = Math.round(
            (engine.swarm.downloaded / fileSize) * 100
          )
          console.log(`Movie downloaded: ${progress} %`)
        })
        engine.on('idle', () => {
          console.log(`Movie path:${basedir}/${fileName}${fileExt}`)
          if (filmref) {
            upsert_movie(
              {
                path: `${basedir}/${fileName}${fileExt}`,
                filmRef: filmref,
                magnet: hash,
              },
              { magnet: hash }
            )
          }
        })
      } else {
        let stats = fs.statSync(filepath)
        let size = stats['size']
        let start = 0
        let end = size - 1
        let mimetype = mime.lookup(filepath)
        console.log(`[FROM FILE] Streaming ${filepath}`)
        localfilestream(res, filepath, start, end, mimetype, size)
      }
    })
  } catch (error) {
    res.status(400).json({
      error: error,
    })
    return
  }
}

exports.getMimetype = (req, res, next) => {
  try {
    if (req.params.hash.length < 32) {
      res.status(400).json({
        error: 'invalid hash',
      })
      return
    }
    let hash = req.params.hash
    let magnet = `magnet:?xt=urn:btih:${hash}`
    let basedir = movie_path + hash.substring(0, 10)
    const engine = torrentStream(magnet, {
      connections: 100,
      uploads: 10,
      path: basedir,
      verify: true,
      trackers: tracker_list,
    })
    engine.on('ready', () => {
      engine.files.forEach((file) => {
        if (
          path.extname(file.name) !== '.mp4' &&
          path.extname(file.name) !== '.avi' &&
          path.extname(file.name) !== '.ogg' &&
          path.extname(file.name) !== '.mkv' &&
          path.extname(file.name) !== '.webm'
        ) {
          file.deselect()
          return
        }
        let mimetype = mime.lookup(file.name)
        let mimeVideo = mimetype.split('/')[0]
        if (mimeVideo === 'video') {
          engine.destroy()
          res.json({ mimetype: mimetype })
        }
      })
    })
  } catch (error) {
    res.status(400).json({
      error: error,
    })
    return
  }
}
