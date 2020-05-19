/** TODO
 * testing all possibilities
 * check if is unreachable from outside
 *
 * ALREADY TESTED: download from hash -> stream whole file
 *
 * tested with 'curl localhost:3000/torrent/OZ6OLQISQ6DVUV54PDAYQTXKBWJMPF6V'
 * -> Movie path:./movies/OZ6OLQISQ6DVUV54PDAYQTXKBWJMPF6V/[ OxTorrent.com ] Fabuleuses.2019.FRENCH.HDRip.XviD-EXTREME.avi
 */

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
  return models.film.findOne({ where: condition }).then(function (obj) {
    if (obj) {
      return obj.update(values)
    }
    //Fallback if not found. Will error out as key constraint not met
    return models.film.create(values)
  })
}

function streamMovie(res, file, start, end, mimetype, basedir, filename, hash) {
  //TODO: consider Duplex instead
  if (mimetype === 'video/mp4' || mimetype === 'video/ogg') {
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
    try {
      let stream = ffmpeg(torrent)
        .videoCodec('libvpx-vp9')
        .audioBitrate(128)
			  .videoBitrate(1024)
        .format('webm')
        .outputOptions(['-deadline realtime', '-movflags frag_keyframe+faststart'])
        .on('progress', (progress) => {
          console.log('[FFMPEG] Converting: ' + progress.percent + '%')
        })
        .on('error', (err, stdout, stderr) => {
          console.log(`[FFMPEG] Cannot process video: ${err.message}`);
          console.log(`[FFMPEG] stdout: ${stdout}`);
          console.log(`[FFMPEG] stderr: ${stderr}`);
        })
        //.save(`${basedir}/${filename}.webm`)
        .pipe(res) //This, for some reason, blocks. Not like the other would work better
      //fix DB path to only serve the converted movie
      //upsert_movie({ path: `${basedir}/${filename}.webm` }, { magnet: hash })
      //pump(stream, res)
    } catch (error) {
      throw new Error(error)
    }
  }
}

exports.getMovie = async (req, res, next) => {
  try {
    let hash = req.params.hash
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
            let end = fileSize
            fileName = file.path.replace(path.extname(file.name), '')
            fileExt = path.extname(file.name)
            console.log(`selected ${fileName}${fileExt} Size: ${fileSize}`)
            if (req.headers.range) {
              console.log('sending chunk of torrent')
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
              console.log('ready to stream chunk:' + fileName)
              streamMovie(res, file, start, end, mimetype, basedir, fileName, hash)
            } else {
              console.log('sending full torrent')
              res.writeHead(200, {
                'Content-Length': file.length,
                'Content-Type': mimetype,
              })
              console.log('ready to stream full:' + fileName)
              streamMovie(res, file, start, end, mimetype, basedir, fileName, hash)
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
          upsert_movie(
            { path: `${basedir}/${fileName}${fileExt}` },
            { magnet: hash }
          )
        })
      } else {
        console.log('found file')
        let stats = fs.statSync(filepath)
        let size = stats['size']
        let start = 0
        let end = size
        let mimetype = mime.lookup(filepath)
        if (req.headers.range) {
          console.log('sending chunk of file')
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
          let stream = fs.createReadStream(filepath, {
            start: start,
            end: end,
          })
          pump(stream, res)
        } else {
          console.log('sending whole file')
          res.writeHead(200, {
            'Content-Length': size,
            'Content-Type': mimetype,
          })
          let stream = fs.createReadStream(filepath, {
            start: start,
            end: end,
          })
          pump(stream, res)
        }
      }
    })
  } catch (error) {
    return next(error)
  }
}
