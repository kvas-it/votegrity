/*
 * Key-value store access control.
 */

'use strict';

var _ = require('lodash');

var cu = require('./crypto-utils');

function StoreAC(base) {
    _.bindAll(this);
    this.base = base;
}

StoreAC.prototype.loadAndParse = function (key, fields) {
    return this.base.read(key)
        .catch(() => '')
        .then((data) => data.split('\n'))
        .then((lines) => _.filter(lines, (l) => !_.startsWith(l, '#')))
        .map((line) => line.split(':'))
        .map((l) => _.mapValues(_.invert(fields), (v) => l[v]));
};

StoreAC.prototype.loadUsers = function () {
    return this.loadAndParse('users', ['id', 'htoken', 'email', 'name', 'role']);
};

StoreAC.prototype.loadACL = function (key) {
    return this.loadAndParse(key + '.acl', ['userOrRole', 'type']);
};

StoreAC.prototype.checkACL = function (key, type, user) {
    return this.loadACL(key).then((acl) => {

        var lines = _.filter(acl, (l) => l.userOrRole === user.id ||
                                         l.userOrRole === user.role);
        var types = _.map(lines, 'type');

        if (types.indexOf(type) !== -1) {
            return;
        }

        if (type === 'read') {
            throw Error('Access denied');
        }

        // check if any write-once is applicable.
        var onces = _.filter(types, (t) => _.startsWith(t, 'write-once@'));
        var ends = _.map(onces, (o) => Number(o.substr(11)));
        var end = _.max(ends);

        return this.base.getTimeStamp(key)
            .then((ts) => {
                if (ts.getTime() > end) {
                    throw Error('Access denied');
                }
            });
    });
};

StoreAC.prototype.accessCheck = function (key, type, accessToken) {
    return this.loadUsers()
        .then((users) => {
            if (!_.any(users, (u) => u.role === 'moderator')) {
                return; // No moderator defined -- disable access control.
            }

            var hashedToken = cu.hash(String(accessToken));
            var user = _.filter(users, (u) => u.htoken === hashedToken)[0];

            if (user === undefined) {
                throw Error('Access denied');
            }

            if (user.role === 'moderator') {
                return;
            }

            return this.checkACL(key, type, user);
        });
};

StoreAC.prototype.write = function (key, value, accessToken) {
    return this.accessCheck(key, 'write', accessToken)
        .then(() => this.base.write(key, value));
};

StoreAC.prototype.read = function (key, accessToken) {
    return this.accessCheck(key, 'read', accessToken)
        .then(() => this.base.read(key));
};

StoreAC.prototype.getTimeStamp = function (key, accessToken) {
    return this.accessCheck(key, 'read', accessToken)
        .then(() => this.base.getTimeStamp(key));
};

module.exports = StoreAC;
