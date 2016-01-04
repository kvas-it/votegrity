/*
 * Tests for the store access synchroniser.
 */

'use strict';

require('should');
var _ = require('lodash');
var P = require('bluebird');

var StoreSync = require('../../server/store-sync');

/* Store for syncronisation tests. */
function TestStore() {
    _.bindAll(this);
    this.data = {};
    this.ops = [];
}

TestStore.prototype.read = function (key) {
    this.ops.push('r' + key);
    return P.delay(3)
        .then(() => this.ops.push('R' + key))
        .then(() => this.data[key]);
};

TestStore.prototype.write = function (key, value) {
    this.ops.push('w' + key + ':' + value);
    return P.delay(3)
        .then(() => this.data[key] = value)
        .then(() => this.ops.push('W' + key + ':' + value))
        .return(true);
};

describe('Key-value store synchroniser', function () {

    var store;
    var ss;

    beforeEach(function () {
        store = new TestStore();
        ss = new StoreSync(store);
    });

    it('should synchronise access to the same key', function () {

        ss.write('a', '1');
        var r1 = ss.read('a');
        ss.write('a', '2');
        var r2 = ss.read('a');
        var w3 = ss.write('a', '3');

        return P.join(r1, r2, w3, (r1_got, r2_got) => {
            r1_got.should.be.eql('1');
            r2_got.should.be.eql('2');
            store.ops.should.be.eql([
                'wa:1', 'Wa:1',
                'ra', 'Ra',
                'wa:2', 'Wa:2',
                'ra', 'Ra',
                'wa:3', 'Wa:3'
            ]);
        });
    });

    it('should not synchronise reads', function () {

        ss.write('a', '1');
        var r1 = ss.read('a');
        var r2 = ss.read('a');

        return P.join(r1, r2, () => {
            store.ops.should.be.eql(['wa:1', 'Wa:1', 'ra', 'ra', 'Ra', 'Ra']);
        });
    });

    it('should not synchronise writes to different keys', function () {

        var wa = ss.write('a', '1');
        var wb = ss.write('b', '1');

        return P.join(wa, wb, () => {
            store.ops.should.be.eql(['wa:1', 'wb:1', 'Wa:1', 'Wb:1']);
        });
    });
});
