/*
 * Tests for triggers on key-value store.
 */

'use strict';

require('should');
var P = require('bluebird');

var StoreMock = require('../utils/store-mock.js');
var StoreTriggers = require('../../server/store-triggers');

describe('Triggers', function () {

    var store;
    var st;

    beforeEach(function () {
        store = new StoreMock({record: true, data: {a1: 'hello', b1: 'bye'}});
        st = new StoreTriggers(store);
    });

    it('should fire for writes', function () {
        var log = [];
        st.addTrigger({
            op: 'write',
            key: 'a1',
            before: function (store, key, value) {
                log.push('before ' + key + ':' + value);
                return value + '!';
            },
            after: function (store, key, value) {
                log.push('after ' + key + ':' + value);
            }
        });
        return st.write('a1', 'foo').then(function () {
            log.should.be.eql(['before a1:foo', 'after a1:foo!']);
            store.data.a1.should.be.eql('foo!');
        });
    });

    it('should fire for reads', function () {
        var log = [];
        st.addTrigger({
            op: 'read',
            key: 'a1',
            before: function (store, key, value) {
                log.push('before ' + key + ':' + value);
            },
            after: function (store, key, value) {
                log.push('after ' + key + ':' + value);
                return value + '!';
            }
        });
        return st.read('a1').then(function (value) {
            value.should.be.eql('hello!');
            log.should.be.eql(['before a1:undefined', 'after a1:hello']);
        });
    });

    it('should understand regexps', function () {
        var log = [];
        st.addTrigger({
            op: 'read',
            key: /^a\d$/,
            before: (store, key) => log.push(key)
        });
        return P.all([st.read('a1'), st.read('b1')]).then(function () {
            log.should.be.eql(['a1']);
        });
    });

    it('can have custom filters', function () {
        var log = [];
        st.addTrigger({
            match: (op, key) => op === 'read' && key[0] === 'a',
            before: (store, key) => log.push(key)
        });
        return P.all([
            st.read('a1'),
            st.read('b1'),
            st.write('a1', 'a')
        ]).then(function () {
            log.should.be.eql(['a1']);
        });
    });
});
