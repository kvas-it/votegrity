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

/* Wrapper for serialising access to the same key. */
Store.prototype.serialise = function (func, key, mode) {
    var wait;
    var promiseMap;
    if (mode === 'r') {
        wait = P.resolve(this.writes[key]);
        promiseMap = this.reads;
    } else { // 'w'
        wait = P.all([this.writes[key], this.reads[key]]);
        promiseMap = this.writes;
    }
    var operation = wait.then(func);
    var nextWait = operation
        .catch(() => 0)
        .then(() => {
            if (promiseMap[key] === nextWait) {
                delete promiseMap[key];
            }
        });
    promiseMap[key] = nextWait;
    return operation;
};

Store.prototype.write = P.method(function (key, value) {
    this.checkKey(key);
    return this.serialise(() => writeFile(this.dir + '/' + key, value), key, 'w')
        .return(true);
});

Store.prototype.read = function (key) {
    return this.serialise(() => readFile(this.dir + '/' + key, 'utf8'), key, 'r')
        .catch((err) => {
            if (_.startsWith(err.message, 'ENOENT')) {
                throw Error('Missing key: ' + key);
            } else {
                throw err;
            }
        });
};

module.exports = Store;
