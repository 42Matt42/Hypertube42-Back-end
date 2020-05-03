const axios = require('axios')
const fs = require('fs')
const { Transform } = require('stream')
const trackerList = [
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://glotorrents.pw:6969/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://torrent.gresille.org:80/announce',
  'udp://p4p.arenabg.com:1337',
  'udp://tracker.leechers-paradise.org:6969]',
]
const torrentStream = require('torrent-stream')
const convertMp4 = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase())
    callback()
  },
})

exports.parse = async (req, res) => {
  const id = req.query.id
  const range = req.query.range
  try {
    const movie = await axios.get(
      'https://yts.mx/api/v2/movie_details.json?movie_id=' + id
    )
    const movieNameUri = encodeURI(movie.data.data.movie.title)
    const magnet = `magnet:?xt=urn:btih:${movie.data.data.movie.torrents[0].hash}&dn=${movieNameUri}&tr=${trackerList[1]}&tr=${trackerList[2]}`
    const engine = torrentStream(magnet)
    console.log(range)

    engine.on('ready', function () {
      console.log('filename:', engine.files[0].name)
      let positions = range.split('-')
      let start = parseInt(positions[0], 10)
      let file_size = engine.files[0].length
      let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1

      let chunksize = end - start + 1
      let head = {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + file_size,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(206, head)
      let stream_position = {
        start: start,
        end: end,
      }
      let stream = engine.files[0].createReadStream(stream_position)
      let movie = fs.createWriteStream('uploads/movies/' + engine.files[0].name)
      stream.pipe(movie)
      stream.pipe(res)
    })
    // res.status(200).json({
    //   magnet: magnet,
    // })
  } catch (error) {
    console.log(error)
    res.status(500).send()
  }
}
