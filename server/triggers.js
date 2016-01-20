/*
 * Triggers on the key-value store that implement voting logic.
 */

'use strict';

var P = require('bluebird');

var StoreTriggers = require('./store-triggers');
var tu = require('./text-utils');

var ballotsOutFields = ['id', 'token'];
var ballotsInFields = ['token'];

/*
 * Read key value from the store, parse it according to the fields,
 * call the function on parsed value, unparse the result and store it
 * back into the same key.
 */
function process(store, key, fields, func) {
    return store.read(key)
        .catch(() => '')
        .then((data) => tu.parseCSV(data, fields))
        .then(func)
        .then((recs) => tu.unparseCSV(recs, fields))
        .then((data) => store.write(key, data))
        .return();
}

var ballotDistrTrigger = {
    op: 'write',
    key: /^ballot-\d+$/,
    after: function (store, key, value) {
        var t = key.split('-');
        var userId = t[1];
        return P.all([
            process(store, 'ballots-out', ballotsOutFields, function (bo) {
                if (bo.filter((r) => r.token === value).length === 0) {
                    bo.push({id: userId, token: value});
                }
                return bo;
            }),
            store.write('ballot-' + userId + '-filled.acl',
                userId + ':read\n' + userId + ':write-once@' + String(Date.now()))
        ]);
    }
};

var ballotFillTrigger = {
    op: 'write',
    key: /^ballot-\d+-filled$/,
    after: function (store, key) {
        var t = key.split('-');
        var userId = t[1];
        return store.read('ballot-' + userId)
            .then(function (token) {
                return process(store, 'ballots-in', ballotsInFields,
                    function (bi) {
                        if (bi.filter((r) => r.token === token).length === 0) {
                            bi.push({token: token});
                        }
                        return bi;
                    });
            });
    }
};

var ballotsInTrigger = {
    op: 'write',
    key: 'ballots-in',
    after: function (store) {
        return store.write('ballots-in.acl', '*:read').return();
    }
};

var triggers = [
    ballotDistrTrigger,
    ballotFillTrigger,
    ballotsInTrigger
];

module.exports = function (base) {
    var st = new StoreTriggers(base);
    triggers.forEach(st.addTrigger);
    return st;
};
