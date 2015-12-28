/*
 * Server key-value store.
 */

'use strict';

var fs = require('fs');
var _ = require('lodash');
var P = require('bluebird');

var readFile = P.promisify(fs.readFile);
var writeFile = P.promisify(fs.writeFile);

function Store(dir) {
    _.bindAll(this);
    this.dir = dir;
    this.reads = {};
    this.writes = {};
    this.ensureDir();
}

/* Ensure that data directory exists and is accessible. */
Store.prototype.ensureDir = function () {
    try {
        var stats = fs.statSync(this.dir);
        if (!stats.isDirectory()) {
            throw Error('Error: ' + this.dir + ' is not a directory');
        }
    } catch (err) {
        if (_.startsWith(err.message, 'ENOENT')) {
            fs.mkdirSync(this.dir, parseInt('700', 8));
        } else {
            throw err;
        }
    }
};

Store.prototype.checkKey = function (key) {
    if (!key.match(/^[\w\-][\w\.\-]*$/)) {
        throw Error('Invalid key: ' + key);
    }
};

Store.prototype.write = P.method(function (key, value) {
    this.checkKey(key);
    var operation = P.all([this.writes[key], this.reads[key]])
        .then(() => writeFile(this.dir + '/' + key, value))
        .return(true);
    var waitHandlers = operation
        .catch(() => true)
        .then(() => {
            if (this.writes[key] === waitHandlers) {
                delete this.writes[key];
            }
        });
    this.writes[key] = waitHandlers;
    return operation;
});

Store.prototype.read = function (key) {
    var operation = P.resolve(this.writes[key])
        .then(() => readFile(this.dir + '/' + key, 'utf8'))
        .catch((err) => {
            if (_.startsWith(err.message, 'ENOENT')) {
                throw Error('Missing key: ' + key);
            } else {
                throw err;
            }
        });
    var waitHandlers = operation
        .catch(() => true)
        .then(() => {
            if (this.reads[key] === waitHandlers) {
                delete this.reads[key];
            }
        });
    this.reads[key] = waitHandlers;
    return operation;
};

module.exports = Store;
