const models = require('../models')
const errors = require('../helpers/errors')
const config = require('../config/config')
// const auth = require('../helpers/auth')
const moment = require('moment')
const {Sequelize, sequelize} = require('sequelize')
const db = require('../models/index')

async function createFilm(filmRef) {
  try {
    console.log("create:", filmRef)
    let result = await db.film.create({
      filmRef
    })
    return result


  } catch (error) {
    throw new Error(error)
  }
}

async function checkFilm(filmRef) {
  try {
    let result = await db.film.findOne({
      attributes: ['id'],
      where: {filmRef},
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

//TODO get comments if exist
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
      let commentInfo = await db.comment.findAll({
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
    return res.status(500).json({
      error: error,
    })
  }

}

//TODO ist it ok to let users add identical comments?
exports.postComment = async (req, res) => {
  try {
    let text = req.body.text
    let filmRef = req.params.filmRef
    let film = await checkFilm(filmRef)

    if (film === null) {
      film = await createFilm(filmRef)
    }
    let filmId = film.dataValues.id
    let comment = await db.comment.create({
      filmId,
      text,
      userId: req.userId,
    })
    let commentInfo = await db.comment.findOne({
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
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error: error,
    })
  }

}


exports.getViews = async (req, res) => {
  try {

  } catch (error) {

  }

}

exports.postView = async (req, res) => {
  try {

  } catch (error) {

  }

}

