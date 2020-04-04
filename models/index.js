//reference: https://sequelize.readthedocs.io/en/1.7.0/articles/express/

const {Sequelize} = require('sequelize');
const config = require('../config/config');
const fs        = require('fs');
const path      = require('path');
const basename  = path.basename(__filename);

const db = {};

console.log("sequelize", config.dbUser);
console.log("sequelize", config.db);
console.log("sequelize", config.host);

const dbc = new Sequelize(config.db, config.dbUser, config.dbPassword, {
    host: config.host,
    dialect: 'mysql',
    port: config.dbPort,
    define: {
        timestamps: false,
        // freezeTableName: true,
    },

});

//test connection
dbc
    .authenticate()
    .then(function (err) {
        console.log('Connection has been established successfully.');
    })
    .catch(function (err) {
        console.log('Unable to connect to the database:', err);
    });


fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = dbc['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

//run associate if exists
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});




db.dbc = dbc;
db.Sequelize = Sequelize;

module.exports = db;