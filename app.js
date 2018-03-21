const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.Promise = global.Promise;

mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ds117749.mlab.com:17749/kumparan-test`, err => {
    if (err) {
        console.log(err);
    } else {
        console.log('DB Connected');
    }
});


const newsRoutes = require('./api/routes/news');
const topicRoutes = require('./api/routes/topics')


// Logger
app.use(morgan('dev'));

// Body Parser
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json());

// Cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        return res.status(200).json({});
    }
    next();
});

// Routes
app.use('/news', newsRoutes);
app.use('/topics', topicRoutes);

app.use('/public', express.static('public'));

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;