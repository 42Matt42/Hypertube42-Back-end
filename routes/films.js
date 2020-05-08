const express = require('express')
const router = express.Router()
const filmsController = require('../controllers/films')
const auth = require('../helpers/auth')

//film views
router
  .route('/view')
  .get(auth.verifyToken, filmsController.getViews)
  .post(auth.verifyToken, filmsController.postView)

//comments for films
router
  .route('/comment/:filmRef')
  .get(auth.verifyToken, filmsController.getComments)
  .post(auth.verifyToken, filmsController.postComment)


module.exports = router
