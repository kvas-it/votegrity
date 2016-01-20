/*
 * Tests for the store access control.
 */

'use strict';

require('should');
var P = require('bluebird');

var cu = require('../../server/crypto-utils');
var StoreMock = require('../utils/store-mock');
var StoreSync = require('../../server/store-sync');
var StoreAC = require('../../server/store-access-control');

var fail = () => {throw Error('Test failed');};
var accessDenied = (err) => err.message.should.be.eql('Access denied');

describe('Key-value store access control', function () {

    var modAT = cu.hash('123'); // Moderator access token.
    var mod = [
        // Moderator user record.
        '1', cu.hash(modAT), 'alice@mod.org', 'Alice Mod', 'moderator'
    ];
    var cntAT = cu.hash('456'); // Counter access token.
    var cnt = [
        // Counter user record.
        '2', cu.hash(cntAT), 'bob@cnt.org', 'Bob Cnt', 'counter'
    ];
    var v1AT = cu.hash('789'); // Voter 1 access token.
    var v1 = [
        // Voter 1 user record.
        '3', cu.hash(v1AT), 'carol@vot.org', 'Carol Vot', 'voter'
    ];

    var store;
    var ac;

    beforeEach(function () {
        store = new StoreMock({
            data: {
                users: [mod.join(':'), cnt.join(':'), v1.join(':')].join('\n'),
                a: 'hello',
                b: 'hello',
                'b.acl': [cnt[0] + ':write', v1[0] + ':read'].join('\n'),
                c: 'hello',
                'c.acl': v1[0] + ':write-once@1451948604276',
                d: 'yo!',
                'd.acl': 'counter:write\nvoter:read',
                e: 'yo!',
                'e.acl': '*:read',
                'f.acl': v1[0] + ':write-once@1451948604276'
            },
            start: new Date(2000, 1, 1)
        });
        ac = new StoreSync(new StoreAC(store));
    });

    it('should allow access if the users list is not there', function () {
        ac = new StoreAC(new StoreMock());
        return ac.write('a', 'b').then(() => ac.read('a'));
    });

    it('should not allow access without a token', function () {
        return P.all([
            ac.read('a').then(fail).catch(accessDenied),
            ac.getTimeStamp('a').then(fail).catch(accessDenied),
            ac.write('a', '1').then(fail).catch(accessDenied)
        ]);
    });

    it('should not allow access with invalid token', function () {
        return P.all([
            ac.read('a', 'foo').then(fail).catch(accessDenied),
            ac.getTimeStamp('a', 'foo').then(fail).catch(accessDenied),
            ac.write('a', '1', 'foo').then(fail).catch(accessDenied)
        ]);
    });

    it('should allow access for moderator without acl', function () {
        return P.all([
            ac.write('a', '1', modAT),
            ac.read('a', modAT),
            ac.getTimeStamp('a', modAT)
        ]);
    });

    it('should not allow access for others without acl', function () {
        return P.all([
            ac.read('a', cntAT).then(fail).catch(accessDenied),
            ac.getTimeStamp('a', cntAT).then(fail).catch(accessDenied),
            ac.write('a', '1', cntAT).then(fail).catch(accessDenied)
        ]);
    });

    it('should follow the acl', function () {
        return P.all([
            ac.read('b', cntAT).then(fail).catch(accessDenied),
            ac.getTimeStamp('b', cntAT).then(fail).catch(accessDenied),
            ac.write('b', '1', cntAT),
            ac.read('b', v1AT),
            ac.getTimeStamp('b', v1AT),
            ac.write('b', '1', v1AT).then(fail).catch(accessDenied)
        ]);
    });

    it('should follow the acl with roles', function () {
        return P.all([
            ac.read('d', cntAT).then(fail).catch(accessDenied),
            ac.getTimeStamp('d', cntAT).then(fail).catch(accessDenied),
            ac.write('d', '1', cntAT),
            ac.read('d', v1AT),
            ac.getTimeStamp('d', v1AT),
            ac.write('d', '1', v1AT).then(fail).catch(accessDenied)
        ]);
    });

    it('should undestand * in the acl', function () {
        return P.all([
            ac.read('e', cntAT),
            ac.write('e', '1', cntAT).then(fail).catch(accessDenied),
            ac.read('e', v1AT)
        ]);
    });

    it('should let anyone read acls', function () {
        return P.all([
            ac.read('b.acl', cntAT),
            ac.write('b.acl', '1', cntAT).then(fail).catch(accessDenied),
            ac.read('b.acl', v1AT)
        ]);
    });

    it('should allow writing once', function () {
        return P.all([
            ac.write('f', '1', v1AT),
            ac.write('c', '1', v1AT),
            ac.write('c', '1', v1AT).then(fail).catch(accessDenied)
        ]);
    });
});
