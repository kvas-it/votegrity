/*
 * Tests for real triggers.
 */

'use strict';

require('should');

var StoreMock = require('../utils/store-mock.js');
var addTriggers = require('../../server/triggers');

var BS5 = '5:abcd:distributed';
var BS5F = '5:abcd:filled';
var BS6 = '6:1234:distributed';
var BS56 = BS5 + '\n' + BS6;
var BS56F = BS5F + '\n' + BS6;

describe('Ballot tracking triggers', function () {

    var store;
    var st;

    beforeEach(function () {
        store = new StoreMock({record: true, data: {}});
        st = addTriggers(store);
    });

    it('should enter users into empty table', function () {
        return st.write('ballot-5', 'abcd').then(function () {
            store.data['ballots-state'].should.be.eql(BS5);
        });
    });

    it('should add users to existing table', function () {
        store.data['ballots-state'] = BS5;
        return st.write('ballot-6', '1234').then(function () {
            store.data['ballots-state'].should.be.eql(BS56);
        });
    });

    it('should track state', function () {
        store.data['ballots-state'] = BS56;
        return st.write('ballot-5-filled', '8765').then(function () {
            store.data['ballots-state'].should.be.eql(BS56F);
        });
    });
});
