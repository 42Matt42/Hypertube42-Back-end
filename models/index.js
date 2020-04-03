//reference: https://sequelize.readthedocs.io/en/1.7.0/articles/express/

const {Sequelize} = require('sequelize');
const config = require('../config/config');
const fs        = require('fs');
const path      = require('path');
const basename  = path.basename(__filename);

const db = {};

const sequelize = new Sequelize(config.db, config.dbUser, config.dbPassword, {
    host: config.host,
    dialect: 'mysql',
    port: config.dbPort,
    define: {
        timestamps: false
    },

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

//test connection
sequelize
    .authenticate()
    .then(function (err) {
        console.log('Connection has been established successfully.');
    })
    .catch(function (err) {
        console.log('Unable to connect to the database:', err);
    });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;