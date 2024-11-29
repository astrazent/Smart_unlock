const path = require('path');
const express = require('express');

const configviewengine = (app) => {
    //config template engine
    app.set('views', path.join('./src', 'views'));
    app.set('view engine', 'ejs');

    // config static files
    app.use(express.static(path.join('./src', 'public'))); // Nơi chứa static file
}
module.exports = configviewengine;