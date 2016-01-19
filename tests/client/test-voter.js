/*
 * Tests for voter ui.
 */

describe('Voting UI', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var crypto = window.registry.crypto;
    var cnst = window.registry.cnst;
    var vot = window.registry.vot;

    var users = '1:x:a@b.c:A:moderator\n5:y:b@c.d:B:voter\n8:z:c@d.e:C:voter';
    var storeMock;
    var view;

    function makeBallotsData(ballots) {
        var prefix = cnst.ballotsSeparator + cnst.ballotsSeparator;
        return crypto.sign(prefix + ballots);
    }

    beforeEach(function () {
        storeMock = mocking.mockStore();
        mocking.mockCrypto('123');
        mocking.mock('auth.htoken', 'y'); // Authenticate as 5.
        view = vot.VotingView();
        return storeMock.setMany({
            users: users,
            ballots: makeBallotsData('A')
        });
    });

    afterEach(mocking.unmockAll);

    it('should indicate that the ballot is not distributed', function () {
        view.haveBallot().should.be.eql(false);
    });

    it('should indicate that the ballot is distributed', function () {
        return storeMock.set('ballot-5', 'A')
        .then(function () {
            view.haveBallot().should.be.eql(true);
        });
    });

    it('should detect invalid ballot', function () {
        return storeMock.set('ballot-5', 'B')
        .then(function () {
            view.haveBallot().should.be.eql('CHECK FAILED');
        });
    });

    it('should detect invalid ballot list', function () {
        return storeMock.setMany({
            ballots: makeBallotsData('A') + ' fake',
            'ballot-5': 'A'
        })
        .then(function () {
            view.haveBallot().should.be.eql('CHECK FAILED');
        });
    });

    it('should generate voter token', function () {
    });

    it('should vote', function () {
    });

    it('should vote only once', function () {
    });

    it('should allow empty votes', function () {
    });

});
