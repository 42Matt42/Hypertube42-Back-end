const jwt = require('jsonwebtoken')
const config = require('../config/config')
const moment = require('moment')
const { Sequelize, sequelize } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const db = require('../models/index')
const axios = require('axios')

exports.redirect42 = async (req, res) => {
    let code = req.query.code
    try {
        let response = await axios.post('https://api.intra.42.fr/oauth/token', {
            grant_type: 'authorization_code',
            client_id: config.client42,
            client_secret: config.secret42,
            code: code,
            redirect_uri: config.redirect42,
        })
        let exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
        const jwt_token = jwt.sign(
            {
                exp: exp,
                data: {
                    id: 999,
                    username: 'testuser',
                    token: response.data.access_token,
                },
            },
            config.jwt
        )
        return res.redirect('http://localhost:8080?code=' + jwt_token)
    } catch (error) {
        return res.status(error).json({
            error: error,
        })
    }
}
exports.redirectGitHub = async (req, res) => {
    let code = req.query.code
    try {
        let response = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: config.clientGH,
                client_secret: config.secretGH,
                code: code,
            }
        )
        let exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
        const jwt_token = jwt.sign(
            {
                data: {
                    id: 999,
                    username: 'usertest',
                    token: response.data,
                },
            },
            config.jwt
        )
        return res.redirect('http://localhost:8080?code=' + jwt_token)
    } catch (error) {
        return res.status(500).json({
            error: error,
        })
    }
}

exports.redirectFacebook = async (req, res) => {
    let code = req.query.code
    try {
        let response = await axios.get(
            `https://graph.facebook.com/v6.0/oauth/access_token?client_id=1245062255689643&client_secret=aa162bbac8aa37524abe9216c5cdeb85&code=${code}&redirect_uri=http://localhost:5555/oauth/fb`
        )
        let exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
        const jwt_token = jwt.sign(
            {
                exp: exp,
                data: {
                    id: 999,
                    username: 'facebook',
                    token: response.data,
                },
            },
            config.jwt
        )
        return res.redirect('http://localhost:8080?code=' + jwt_token)
    } catch (error) {
        return res.status(500).json({
            error: error,
        })
    }
}
