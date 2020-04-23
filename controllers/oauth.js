const jwt = require('jsonwebtoken')
const config = require('../config/config')
const axios = require('axios').default
const db = require('../models/index')

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
        axios.defaults.headers.common[
            'Authorization'
        ] = `Bearer ${response.data.access_token}`
        let userData = await axios.get('https://api.intra.42.fr/v2/me')
        const result = await db.user.findOrCreate({
            where: {
                firstName: userData.data.first_name,
                lastName: userData.data.last_name,
                email: userData.data.email,
                username: userData.data.login,
                photo: userData.data.image_url,
                password: 'àchangerplustard',
            },
        })
        const jwt_token = jwt.sign(
            {
                exp: exp,
                data: {
                    id: result[0].dataValues.id,
                    username: result[0].dataValues.username,
                    token: result[0].dataValues.access_token,
                    photo: result[0].dataValues.photo,
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
