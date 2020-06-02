const models = require('../models')
const errors = require('../helpers/errors')
const config = require('../config/config')
const moment = require('moment')

const path = require('path')
const fs = require("fs")
const {Sequelize, sequelize} = require('sequelize')
const axios = require("axios").default;
const OS = require('opensubtitles-api');

const srt2vtt = require('srt-to-vtt')

const OpenSubtitles = new OS({
  useragent: config.OSagent,
  username: config.OSuser,
  password: config.OSpass,
  ssl: true
});

var languageDictionary = {
  'en': 'eng',
  'fr': 'fre',
}

async function createFilm(filmRef) {
  try {
    let result = await models.film.create({
      filmRef
    })
    return result

  } catch (error) {
    throw new Error(error)
  }
}

async function checkFilm(filmRef) {
  try {
    let result = await models.film.findOne({
      attributes: ['id'],
      where: {filmRef},
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

exports.getComments = async (req, res) => {
  try {
    let filmRef = req.params.filmRef
    let film = await checkFilm(filmRef)
    if (film === null) {
      return res.status(200).json({
        status: 'Success',
        comments: [],
      })
    } else {
      let commentInfo = await models.comment.findAll({
        where: {filmId: film.id},
        attributes: [
          'id',
          'date',
          'text',
          [Sequelize.col('user.username'), 'username']
        ],
        include: [{
          model: models.user,
          attributes: []
        }],
      })
      return res.status(200).json({
        status: 'Success',
        comments: commentInfo
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      error: error,
    })
  }

}

//TODO ist it ok to let users add identical comments?
exports.postComment = async (req, res) => {
  try {
    let text = req.body.text
    if (!text || text === "") {
      return res.status(405).json({
        error: "Text cannot be empty",
      })
    }

    let filmRef = req.params.filmRef
    let film = await checkFilm(filmRef)
    if (film === null) {
      film = await createFilm(filmRef)
    }
    let filmId = film.dataValues.id
    let comment = await models.comment.create({
      filmId,
      text,
      userId: req.userId,
    })
    let commentInfo = await models.comment.findOne({
      where: {id: comment.id},
      attributes: [
        'id',
        'date',
        'text',
        [Sequelize.col('user.username'), 'username']
      ],
      include: [{
        model: models.user,
        attributes: []
      }],
    })
    return res.status(200).json({
      status: 'Success',
      comment: commentInfo,
    })
  } catch
    (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = errors.getErrors(error)
      return res.status(405).json({
        error: errorMessages,
      })
    }
    return res.status(400).json({
      error: error,
    })
  }
}


exports.getViews = async (req, res) => {
  try {
    let userId = req.userId
    let viewInfo = await models.filmView.findAll({
      where: {userId},
      attributes: [
        'date',
        [Sequelize.col('film.filmRef'), 'filmRef']
      ],
      include: [{
        model: models.film,
        attributes: []
      }],
    })
    return res.status(200).json({
      status: 'Success',
      views: viewInfo
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      error: error,
    })
  }
}

exports.postView = async (req, res) => {
  try {
    let filmRef = req.body.filmRef
    let film = await checkFilm(filmRef)
    if (film === null) {
      film = await createFilm(filmRef)
    }
    let filmId = film.dataValues.id
    let date = moment().toISOString()
    let view = await models.filmView.upsert({
      filmId,
      userId: req.userId,
      date,
    })
    let result = await models.film.update({
        viewed: date,
      },
      {
        where: {id: filmId}
      })

    let filmInfo = await models.filmView.findOne({
      where: {filmId, userId: req.userId},
      attributes: [
        'id',
        'date',
        [Sequelize.col('user.username'), 'username']
      ],
      include: [{
        model: models.user,
        attributes: []
      }],
    })
    return res.status(200).json({
      status: 'Success',
      views: filmInfo,
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      error: error,
    })
  }


}

exports.getSubtitles = async (req, res) => {
  try {
    let filename
    let imdbid = req.params.imdbid
    let language = req.query.language
    let langCode = languageDictionary[language]
    if (!langCode) {
      return res.status(400).json({
        error: "Language not found",
      })
    }
    if (!imdbid) {
      return res.status(400).json({
        error: "Provide imdbid",
      })
    }

    let subtitles = await OpenSubtitles.search({
      sublanguageid: langCode,       // Can be an array.join, 'all', or be omitted.
      // filename,                   // The video file name. Better if extension is included.
      // season: '2',
      // episode: '3',
      // extensions: ['srt', 'vtt'], // Accepted extensions, defaults to 'srt'.
      // limit: '1',                 // Can be 'best', 'all' or an arbitrary nb. Defaults to 'best'
      imdbid,
    })
    //TODO check os compatibility
    if (subtitles[language]) {
        let pathname = path.join('uploads', 'subtitles');
        filename = language + "." + imdbid + ".vtt";
        let outputLocationPath = path.join(pathname, filename);

        let resp = await axios({
          method: "get",
          url: subtitles[language].url,
          responseType: "stream",
        })

        resp.data.pipe(srt2vtt())
          .on('error', (e) => {
            return res.status(400).json({
              error: e,
            })
          })
          .pipe(fs.createWriteStream(outputLocationPath))
          .on('error', (e) => {
            return res.status(400).json({
              error: e,
            })
          })
          .on('finish',() => {
              return res.status(200).json({
                status: 'Success',
                file: config.server + '/static/' + filename
              })
            })

    } else {
      return res.status(400).json({
        error: "Subtitles not found",
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      error: error,
    })
  }
}

