const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT;
const host = process.env.HOST;
const dbPort = process.env.DBPORT;
const dbUser = process.env.DBUSER;
const dbPassword = process.env.DBPASSWORD;
const db = process.env.DB;
const jwt = process.env.JWT;
module.exports = {
    port,
    host,
    dbPort,
    dbUser,
    dbPassword,
    db,
    jwt,
}