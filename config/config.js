const dotenv = require('dotenv')
dotenv.config()
module.exports = {
  port: process.env.PORT,
  host: process.env.HOST,
  dbPort: process.env.DBPORT,
  dbUser: process.env.DBUSER,
  dbPassword: process.env.DBPASSWORD,
  db: process.env.DB,
  jwt: process.env.JWT,
  sg: process.env.SG,
  server: process.env.SERVER,
  front: process.env.FRONT,
  email: process.env.EMAIL,
  client42: process.env.CLIENT42,
  secret42: process.env.SECRET42,
  clientGH: process.env.CLIENTGH,
  secretGH: process.env.SECRETGH,
  redirect42: process.env.REDIRECT42,
  redirectGH: process.env.REDIRECTGH,
  clientReddit: process.env.CLIENTREDDIT,
  secretReddit: process.env.SECRETREDDIT,
  redirectReddit: process.env.REDIRECTREDDIT,
  clientFB: process.env.CLIENTFB,
  secretFB: process.env.SECRETFB,
  redirectFB: process.env.REDIRECTFB,
  OSuser: process.env.OSUSER,
  OSpass: process.env.OSPASS,
  OSagent: process.env.OSAGENT,

  //TODO for dev only
  testpass: process.env.TESTPASS,
}
