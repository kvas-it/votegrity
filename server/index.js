/*
 * Votegrity server main module.
 */

'use strict';

var path = require('path');
var express = require('express');
var morgan = require('morgan');

var routes = require('./routes');

var app = express();

app.set('clientRoot', path.normalize(__dirname + '/../client'));
app.set('modulesRoot', path.normalize(__dirname + '/../node_modules'));
app.use(morgan('dev'));

routes.install(app);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Votegrity server listening at http://%s:%s', host, port);
});
