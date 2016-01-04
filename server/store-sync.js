/*
 * Synchronising wrapper around a store that allows only one write or any
 * number of reads at any one moment.
 */

'use strict';

var _ = require('lodash');
var P = require('bluebird');

function StoreSync(base) {
    _.bindAll(this);
    this.base = base;
    this.reads = {};
    this.writes = {};
}

/* Wrapper for serialising access to the same key. */
StoreSync.prototype.serialise = function (func, key, mode) {
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

StoreSync.prototype.read = function (key) {
    return this.serialise(() => this.base.read(key), key, 'r');
};

StoreSync.prototype.write = function (key, value) {
    return this.serialise(() => this.base.write(key, value), key, 'w');
};

StoreSync.prototype.getTimeStamp = function (key) {
    return this.serialise(() => this.base.getTimeStamp(key), key, 'r');
};

module.exports = StoreSync;
