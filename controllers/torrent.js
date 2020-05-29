const models = require('../models')
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
      console.log(err, values)
    })
}

function streamMovie(res, file, start, end, mimetype) {
  if (
    mimetype === 'video/mp4' ||
    mimetype === 'video/ogg' ||
    mimetype === 'video/webm'
  ) {
    res.writeHead(200, {
      'Content-Length': file.length,
      'Content-Type': mimetype,
      'Cache-Control': 'no-store',
    })
    let stream = file.createReadStream({
      start: start,
      end: end,
    })
    console.log('Sending Raw file to stream')
    pump(stream, res)
  } else {
    let chunkSize = end - start + 1
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${file.length}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/webm',
      Connection: 'keep-alive',
      'Cache-Control': 'no-store',
    })
    let torrent = file.createReadStream({
      start: start,
      end: end,
    })
    let command = ffmpeg(torrent)
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
  if (
    mimetype === 'video/mp4' ||
    mimetype === 'video/ogg' ||
    mimetype === 'video/webm'
  ) {
    res.writeHead(200, {
      'Content-Length': size,
      'Content-Type': mimetype,
      'Cache-Control': 'no-store',
    })
    let stream = fs.createReadStream(filepath, {
      start: start,
      end: end,
    })
    console.log('Sending Raw file to stream')
    pump(stream, res)
  } else {
    let chunkSize = end - start + 1
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/webm',
      Connection: 'keep-alive',
      'Cache-Control': 'no-store',
    })
    let torrent = fs.createReadStream(filepath, {
      start: start,
      end: end,
    })
    let command = ffmpeg(torrent)
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
  try {
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
            console.log(`selected ${fileName}${fileExt} Size: ${fileSize}`)
            if (req.headers.range) {
              let range = req.headers.range
              let chunks = range.replace(/bytes=/, '').split('-')
              let chunkStart = chunks[0]
              let chunkEnd = chunks[1]
              start = parseInt(chunkStart, 10)
              if (chunkEnd) {
                end = parseInt(chunkEnd, 10)
              } else {
                end = file.length - 1
              }
              console.log(`[FROM TORRENT] Streaming chunk:${start} <> ${end}`)
              streamMovie(res, file, start, end, mimetype)
            } else {
              console.log('[FROM TORRENT] Streaming whole file')
              streamMovie(res, file, start, end, mimetype)
            }
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
        if (req.headers.range) {
          let range = req.headers.range
          let chunks = range.replace(/bytes=/, '').split('-')
          let chunkStart = chunks[0]
          let chunkEnd = chunks[1]
          start = parseInt(chunkStart, 10)
          if (chunkEnd) {
            end = parseInt(chunkEnd, 10)
          } else {
            end = size - 1
          }
          console.log(`[FROM FILE] Streaming chunk:${start} <> ${end}`)
          localfilestream(res, filepath, start, end, mimetype, size)
        } else {
          console.log('[FROM FILE] Streaming whole file')
          localfilestream(res, filepath, start, end, mimetype, size)
        }
      }
    })
  } catch (error) {
    return next(error)
  }
}

exports.getMimetype = (req, res, next) => {
  try {
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
          res.json({ 'mimetype': mimetype });
        }
      })
    })
  } catch (error) {
    return next(error)
  }
}