/*
 * Store proxy that can run triggers on certain changes in the store.
 */

'use strict';

var _ = require('lodash');
var P = require('bluebird');

function StoreTriggers(base) {
    _.bindAll(this);
    this.base = base;
    this.triggers = [];
}

StoreTriggers.prototype.read = function (key, accessToken) {
    return this.fireTriggers('before', 'read', key, undefined, accessToken)
        .then(() => this.base.read(key, accessToken))
        .then((value) => this.fireTriggers('after', 'read', key, value, accessToken));
};

StoreTriggers.prototype.write = function (key, value, accessToken) {
    return this.fireTriggers('before', 'write', key, value, accessToken)
        .then((value) => this.base.write(key, value, accessToken)
            .then(() => this.fireTriggers('after', 'write', key, value, accessToken)));
};

StoreTriggers.prototype.fireTriggers = function (when, op, key, value, accessToken) {

    var triggers = this.triggers.filter((t) => t.match(op, key));
    var promise = P.resolve(value);

    triggers.forEach((t) => {
        var func = t[when];
        if (func) {
            promise = promise.then((v) => {
                return P.resolve(func(this, key, v, accessToken))
                    .then((v_) => v_ !== undefined ? v_ : v);
            });
        }
    });

    return promise;
};

StoreTriggers.prototype.addTrigger = function (config) {
    if (!config.match) {
        if (_.isRegExp(config.key)) {
            config.match = (op, key) => config.key.test(key) &&
                                        op === config.op;
        } else {
            config.match = (op, key) => key === config.key &&
                                        op === config.op;
        }
    }
    this.triggers.push(config);
};

module.exports = StoreTriggers;
