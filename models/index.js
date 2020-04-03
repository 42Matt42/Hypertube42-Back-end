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

const sequelize = new Sequelize(config.db, config.dbUser, config.dbPassword, {
    host: config.host,
    dialect: 'mysql',
    port: config.dbPort,
    define: {
        timestamps: false
    },

});

//test connection
sequelize
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
        console.log("filter", file);
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        console.log(file);
        var model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });


// Object.keys(db).forEach(modelName => {
//     if (db[modelName].associate) {
//         db[modelName].associate(db);
//     }
// });



db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;