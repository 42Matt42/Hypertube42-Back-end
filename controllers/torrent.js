//TODO testing
//Current version MAY run but hasn't been tested yet

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

function computeMagnetHash(hash) {
  //Placeholder function to resolve hash query
  return `magnet:?xt=urn:btih:${hash}`
}

function checkMovieExists(path) {
  try {
    fs.stat(path)
    return true
  } catch (error) {
    return false
  }
}

function streamMovie(res, file, start, end, mimetype, basedir, filename) {
  //TODO: consider Duplex instead
  if (mimetype === 'video/mp4' || mimetype === 'video/mp4') {
    let stream = file.createReadStream({
      start: start,
      end: end,
    })
    pump(stream, res)
  } else {
    let torrent = file.createReadStream({
      start: start,
      end: end,
    })
    //Consider faster conversion
    let stream = ffmpeg(torrent)
      .videoCodec('libx264')
      .audioCodec('libfdk_aac')
      .format('mp4')
      .save(`${basedir}/${filename}.mp4`)
    pump(stream, res)
  }
}

exports.getMovie = (req, res, next) => {
  let id = req.params.hash
  let quality = req.params.quality
  let basedir = movie_path + id

  try {
    let magnet = computeMagnetHash(id)
    //query DB For path, filename missing for check
    if (checkMovieExists(`${basedir}/${quality}`)) {
      let filepath = `${basedir}/${quality}`
      let stats = fs.statSync(filepath)
      let size = stats['size']
      let start = 0
      let end = size
      let mimetype = mime.lookup(filepath)
      if (req.headers.range) {
        let range = req.headers.range
        let chunks = range.replace(/bytes=/, '').split('-')
        let chunkStart = chunks[0]
        let chunkEnd = chunks[1]
        start = parseInt(chunkStart, 10)
        if (chunkEnd) {
          end = chunkEnd
        }
        let chunkSize = end - start
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimetype,
          Connection: 'keep-alive',
        })
        let stream = fs.createReadStream({
          start: start,
          end: end,
        })
        pump(stream, res)
      } else {
        res.writeHead(200, {
          'Content-Length': size,
          'Content-Type': mimetype,
        })
        let stream = fs.createReadStream({
          start: start,
          end: end,
        })
        pump(stream, res)
      }
    } else {
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
          let end = fileSize
          fileName = file.path.replace(path.extname(file.name), '')
          fileExt = path.extname(file.name)
          if (req.headers.range) {
            let range = req.headers.range
            let chunks = range.replace(/bytes=/, '').split('-')
            let chunkStart = chunks[0]
            let chunkEnd = chunks[1]
            start = parseInt(chunkStart, 10)
            if (chunkEnd) {
              end = chunkEnd
            }
            let chunkSize = end - start
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${file.length}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize,
              'Content-Type': mimetype,
              Connection: 'keep-alive',
            })
            streamMovie(res, file, start, end, mimetype, basedir, fileName)
          } else {
            res.writeHead(200, {
              'Content-Length': file.length,
              'Content-Type': mimetype,
            })
            streamMovie(res, file, start, end, mimetype, basedir, fileName)
          }
        })
      })
      engine.on('download', () => {
        const progress = Math.round((engine.swarm.downloaded / fileSize) * 100)
        //modify in DB percentage
      })
      engine.on('idle', () => {
        //save in DB path + download date
      })
    }
  } catch (error) {
    throw new Error(error)
  }
}
/* function fetchMovieFromDb(id, quality) {
    try {
        result = await db.movie.findOne({
            where: {
                id,
                quality
            }
        })
        //consider torrent to magnet hash conversion?
        return result
    } catch (error) {
        throw new Error(error)
    }
    
} */
