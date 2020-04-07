const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
var models = require('./models/');

const config = require('./config/config');
const usersRoutes = require('./routes/users');


const whitelist = ['http://localhost:8080','https://unruffled-benz-398ce5.netlify.com'];
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/users', usersRoutes);

//force:true to drop all tables every time
models.dbc.sync({force:true}).then(function() {
    app.listen(config.port, () => {
        console.log('Server running on port %s', config.port);
        app.emit("appStarted");
    });
});

module.exports = app;