/*
 * Routes configuration.
 */

'use strict';

var express = require('express');

var Store = require('./store');
var StoreAC = require('./store-access-control');
var StoreSync = require('./store-sync');
var storeService = require('./store-service');

function attachStore(app) {
    var store = new Store(app.get('storeRoot'));
    var storeAC = new StoreAC(store);
    var storeSync = new StoreSync(storeAC);
    app.use('/api/store', storeService(storeSync));
}

function install(app) {
    app.use('/js', express.static(app.get('clientRoot') + '/js'));
    app.use('/cr', express.static(app.get('componentsRoot') + '/cryptico'));
    app.use('/jq', express.static(app.get('componentsRoot') + '/jquery/dist'));
    app.use('/ap', express.static(app.get('componentsRoot') + '/ayepromise'));
    app.route('/*').get(function (req, res) {
        res.sendFile(app.get('clientRoot') + '/index.html');
    });
    attachStore(app);
}

module.exports = {
    install: install
};
