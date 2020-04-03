const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
var models = require('./models/');

const config = require('./config/config');
const usersRoutes = require('./routes/users');


const whitelist = ['https://unruffled-benz-398ce5.netlify.com'];
const corsOptions = {
    origin: function (origin, callback) {
        //TODO update later: now allowing origin to be undefined for local tests
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
};

const app = express();

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/users', usersRoutes);

console.log(config.host);
console.log(config.dbUser);


models.sequelize.sync().then(function() {
    app.listen(config.port, () => {
        console.log('Server running on port %s', config.port);
    });

});

module.exports = app;