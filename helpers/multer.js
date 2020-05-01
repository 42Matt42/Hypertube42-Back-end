const path = require('path')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

exports.storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './uploads')
  },
  filename: (req, file, callback) => {
    const match = ['image/png', 'image/jpeg']
    if (match.indexOf(file.mimetype) === -1) {
      let message = `${file.originalname} is invalid. Only accept png/jpeg.`

      return callback(message, null)
    }

    let filename = `${uuidv4()}${path.extname(file.originalname)}`

    return callback(null, filename)
  },
})
