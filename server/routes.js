/*
 * Routes configuration.
 */

'use strict';

var express = require('express');

var Store = require('./store');
var storeService = require('./store-service');

function install(app) {
    app.use('/js', express.static(app.get('clientRoot') + '/js'));
    app.use('/cr', express.static(app.get('componentsRoot') + '/cryptico'));
    app.use('/api/store', storeService(new Store(app.get('storeRoot'))));
    app.route('/*').get(function (req, res) {
        res.sendFile(app.get('clientRoot') + '/index.html');
    });
}

module.exports = {
    install: install
};
