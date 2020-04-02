const mysql = require('mysql');
const config = require('../config/config');

const connection = mysql.createConnection({
    host: config.host,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.db,
});

connection.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to %s', config.db);
    }
});

module.exports = connection;