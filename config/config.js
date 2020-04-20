const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT;
const host = process.env.HOST;
const dbPort = process.env.DBPORT;
const dbUser = process.env.DBUSER;
const dbPassword = process.env.DBPASSWORD;
const db = process.env.DB;
const jwt = process.env.JWT;
const sg = process.env.SG;
const server = process.env.SERVER;
const email = process.env.EMAIL;
const client42 = process.env.CLIENT42;
const secret42 = process.env.SECRET42;
const clientGH = process.env.CLIENTGH;
const secretGH = process.env.SECRETGH;
const redirect42 = process.env.REDIRECT42;
const redirectGH = process.env.REDIRECTGH;
module.exports = {
    port,
    host,
    dbPort,
    dbUser,
    dbPassword,
    db,
    jwt,
    sg,
    server,
    email,
    client42,
    secret42,
    redirect42,
    clientGH,
    secretGH,
    redirectGH,
};