/*
 * Mock store for testing.
 */

'use strict';

var _ = require('lodash');
var P = require('bluebird');

function StoreMock(options) {
    _.bindAll(this);
    this.options = options || {};
    this.data = this.options.data || {};
    this.timestamps = {};
    this.start = this.options.start || Date.now();
    this.ops = [];
}

StoreMock.prototype.exec = function (func, op, key, value, accessToken) {

    var code = op + ':' + key +
        (value ? ':' + value : '') +
        (accessToken ? ':' + accessToken : '');

    if (this.options.record) {
        this.ops.push(code);
    }

    var promise;
    if (this.options.delay) {
        promise = P.delay(this.options.delay);
    } else {
        promise = P.resolve(true);
    }

    promise = promise.then(func);

    if (this.options.record && this.options.delay) {
        promise = promise.then((ret) => {
            this.ops.push(code.substr(0, 1).toUpperCase() + code.substr(1));
            return ret;
        });
    }

    return promise;
};

StoreMock.prototype.read = function (key, accessToken) {
    return this.exec(() => {
        if (key in this.data) {
            return this.data[key];
        } else {
            throw Error('Missing key: ' + key);
        }
    }, 'r', key, false,  accessToken);
};

StoreMock.prototype.getTimeStamp = function (key, accessToken) {
    return this.exec(() => this.timestamps[key] || this.start,
            't', key, false, accessToken);
};

StoreMock.prototype.write = function (key, value, accessToken) {
    return this.exec(() => {
        this.data[key] = value;
        this.timestamps[key] = new Date(Date.now());
        return true;
    }, 'w', key, value, accessToken);
};

module.exports = StoreMock;
