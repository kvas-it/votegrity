/*
 * Routes configuration.
 */

'use strict';

var express = require('express');

function install(app) {
    app.use('/js', express.static(app.get('clientRoot') + '/js'));
    app.use('/cryptico',
            express.static(app.get('modulesRoot') + '/cryptico/lib'));
    app.route('/*').get(function (req, res) {
        res.sendFile(app.get('clientRoot') + '/index.html');
    });
}

module.exports = {
    install: install
};
