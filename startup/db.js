
const dotenv = require("dotenv");
const config = require("config");


require('dotenv').config();
const mongoose = require('mongoose');
const winston = require('winston');

module.exports = function() {
    let mongoose_uri = '';
    if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD && process.env.MONGODB_HOST && process.env.MONGODB_DATABASE) {
        mongoose_uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;
    } else {
        console.error('Missing MongoDB environment variables.');
    }

    console.log('MongoDB URI:', mongoose_uri); 

    mongoose.connect(mongoose_uri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => winston.info(`Connected to MongoDB...`))
        .catch((error) => winston.error('Error connecting to MongoDB', error));
};
