/*
 * Triggers on the key-value store that implement voting logic.
 */

'use strict';

var P = require('bluebird');

var StoreTriggers = require('./store-triggers');
var tu = require('./text-utils');

var ballotTableFields = ['id', 'ballot', 'state'];

function setBallotRecord(recs, userId, ballotToken, state) {

    var record = {id: userId};
    var existing = recs.filter((r) => r.id === userId)[0];

    if (existing) {
        record = existing;
    } else {
        recs.push(record);
    }

    if (ballotToken) {
        record.ballot = ballotToken;
    }

    if (state) {
        record.state = state;
    }

    return recs;
}

function processCSVKeyValue(store, key, func) {
    return store.read(key)
        .catch(() => '')
        .then((data) => tu.parseCSV(data, ballotTableFields))
        .then(func)
        .then((recs) => tu.unparseCSV(recs, ballotTableFields))
        .then((data) => store.write(key, data))
        .return(undefined);
}

var ballotDistrTrigger = {
    op: 'write',
    key: /^ballot-\d+$/,
    after: (store, key, value) => {
        var t = key.split('-');
        var userId = t[1];
        return P.all([
            processCSVKeyValue(store, 'ballots-state',
                (recs) => setBallotRecord(recs, userId, value, 'distributed')),
            store.write('ballot-' + userId + '-filled.acl',
                userId + ':write-once@' + String(Date.now()))
        ]);
    }
};

var ballotFillTrigger = {
    op: 'write',
    key: /^ballot-\d+-filled$/,
    after: (store, key) => {
        var t = key.split('-');
        var userId = t[1];
        return processCSVKeyValue(store, 'ballots-state',
            (recs) => setBallotRecord(recs, userId, undefined, 'filled'));
    }
};

var triggers = [
    ballotDistrTrigger,
    ballotFillTrigger
];

module.exports = function (base) {
    var st = new StoreTriggers(base);
    triggers.forEach(st.addTrigger);
    return st;
};
