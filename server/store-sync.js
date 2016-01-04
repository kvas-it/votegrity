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
StoreSync.prototype.serialise = function (key, mode, func) {
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

StoreSync.prototype.read = function (key, accessToken) {
    return this.serialise(key, 'r',
            () => this.base.read(key, accessToken));
};

StoreSync.prototype.write = function (key, value, accessToken) {
    return this.serialise(key, 'w',
            () => this.base.write(key, value, accessToken));
};

StoreSync.prototype.getTimeStamp = function (key, accessToken) {
    return this.serialise(key, 'r',
            () => this.base.getTimeStamp(key, accessToken));
};

module.exports = StoreSync;
