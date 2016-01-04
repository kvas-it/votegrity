/*
 * Tests for the store access synchroniser.
 */

'use strict';

require('should');
var P = require('bluebird');

var StoreMock = require('../utils/store-mock.js');
var StoreSync = require('../../server/store-sync');

describe('Key-value store synchroniser', function () {

    var store;
    var ss;

    beforeEach(function () {
        store = new StoreMock({delay: 3, record: true});
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
                'w:a:1', 'W:a:1',
                'r:a', 'R:a',
                'w:a:2', 'W:a:2',
                'r:a', 'R:a',
                'w:a:3', 'W:a:3'
            ]);
        });
    });

    it('should not synchronise reads', function () {

        ss.write('a', '1');
        var r1 = ss.read('a');
        var r2 = ss.read('a');

        return P.join(r1, r2, () => {
            store.ops.should.be.eql([
                'w:a:1', 'W:a:1', 'r:a', 'r:a', 'R:a', 'R:a'
            ]);
        });
    });

    it('should not synchronise writes to different keys', function () {

        var wa = ss.write('a', '1');
        var wb = ss.write('b', '1');

        return P.join(wa, wb, () => {
            store.ops.should.be.eql(['w:a:1', 'w:b:1', 'W:a:1', 'W:b:1']);
        });
    });

    it('should synchronise timestamps like reads', function () {

        var wa = ss.write('a', '1');
        var ta = ss.getTimeStamp('a');
        var tb1 = ss.getTimeStamp('b');
        var tb2 = ss.getTimeStamp('b');
        var wb = ss.write('b', '2');
        var tb3 = ss.getTimeStamp('b');

        return P.join(wa, ta, tb1, tb2, wb, tb3, () => {
            store.ops.should.be.eql([
                'w:a:1', 't:b', 't:b', 'W:a:1', 't:a', 'T:b', 'T:b',
                'w:b:2', 'T:a', 'W:b:2', 't:b', 'T:b'
            ]);
        });
    });
});
