/*
 * Votegrity server main module.
 */

'use strict';

var path = require('path');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');

var routes = require('./routes');

var app = express();

app.set('clientRoot', path.normalize(__dirname + '/../client'));
app.set('componentsRoot', path.normalize(__dirname + '/../bower_components'));
app.set('storeRoot', path.normalize('/tmp/store-123'));
app.use(morgan('dev'));
app.use(bodyParser.json());

routes.install(app);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Votegrity server listening at http://%s:%s', host, port);
});
