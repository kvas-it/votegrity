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
}

Store.prototype.checkKey = function (key) {
    if (!key.match(/^[\w\-][\w\.\-]*$/)) {
        throw Error('Invalid key: ' + key);
    }
};

Store.prototype.write = P.method(function (key, value) {
    this.checkKey(key);
    return writeFile(this.dir + '/' + key, value).return(true);
});

Store.prototype.read = function (key) {
    return readFile(this.dir + '/' + key, 'utf8')
        .catch((err) => {
            if (_.startsWith(err.message, 'ENOENT')) {
                throw Error('Missing key: ' + key);
            }
        });
};

module.exports = Store;
