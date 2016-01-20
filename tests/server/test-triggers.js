/*
 * Tests for real triggers.
 */

'use strict';

require('should');

var StoreMock = require('../utils/store-mock.js');
var addTriggers = require('../../server/triggers');

var B5 = 'abcd';
var B6 = '1234';
var BO5 = '5:' + B5;
var BO6 = '6:' + B6;
var BO56 = BO5 + '\n' + BO6;

describe('Ballot tracking triggers', function () {

    var store;
    var st;

    beforeEach(function () {
        store = new StoreMock({record: true, data: {}});
        st = addTriggers(store);
    });

    it('should create ballots-out', function () {
        return st.write('ballot-5', B5).then(function () {
            store.data['ballots-out'].should.be.eql(BO5);
            store.data['ballot-5'].should.be.eql(B5);
        });
    });

    it('should update ballots-out', function () {
        store.data['ballots-out'] = BO5;
        return st.write('ballot-6', B6).then(function () {
            store.data['ballots-out'].should.be.eql(BO56);
        });
    });

    it('should create ACLs for distributed ballots', function () {
        return st.write('ballot-5', B5).then(function () {
            var acl = store.data['ballot-5-filled.acl'];
            acl.should.startWith('5:read\n5:write-once@');
            var ts = Number(acl.split('@')[1]);
            ts.should.be.approximately(Date.now(), 10);
        });
    });

    it('should create ballots-in', function () {
        store.data['ballot-5'] = B5;
        return st.write('ballot-5-filled', 'a').then(function () {
            store.data['ballots-in'].should.be.eql(B5);
            store.data['ballots-in.acl'].should.be.eql('*:read');
            store.data['ballot-5-filled'].should.be.eql('a');
        });
    });

    it('should update ballots-in', function () {
        store.data['ballot-6'] = B6;
        store.data['ballots-in'] = B5;
        return st.write('ballot-6-filled', 'b').then(function () {
            store.data['ballots-in'].should.be.eql(B5 + '\n' + B6);
        });
    });
});
