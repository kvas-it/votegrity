/*
 * Tests for counter ui.
 */

describe('Ballot issuance view', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var cnt = window.registry.cnt;

    var users = '1:x:a@b.c:A:moderator\n5:y:b@c.d:B:voter\n8:z:c@d.e:C:voter';
    var storeMock;
    var view;

    beforeEach(function () {
        storeMock = mocking.mockStore();
        mocking.mockCrypto('123');
        view = cnt.BallotIssuanceView();
        return storeMock.setMany({
            users: users,
            'voting-descr': 'AAA\nBBB\nCCC',
            'voting-options': '1\n2\n3',
            'ballots.acl': '*:read\ncounter:write'
        });
    });

    afterEach(mocking.unmockAll);

    it('should compute parameters', function () {
        view.issuanceEnabled().should.be.eql(true);
        view.votersCount().should.be.eql(2);
        view.ballotsCount().should.be.eql(0);
        view.toIssue().should.be.eql(2);
        view.canIssue().should.be.eql(true);
    });

    it('should issue all ballots', function () {
        return view.issueAll()
            .then(function () {
                view.ballotsCount().should.be.eql(2);
                view.toIssue().should.be.eql(0);
                view.canIssue().should.be.eql(false);
            });
    });

    it('should issue one ballot', function () {
        return view.issueOne()
            .then(function () {
                view.ballotsCount().should.be.eql(1);
                view.toIssue().should.be.eql(1);
                view.canIssue().should.be.eql(true);
                return view.issueOne();
            })
            .then(function () {
                view.ballotsCount().should.be.eql(2);
                view.toIssue().should.be.eql(0);
                view.canIssue().should.be.eql(false);
            });
    });

});

describe('Counting view', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;
    var cnt = window.registry.cnt;

    var storeMock;
    var view;

    beforeEach(function () {
        storeMock = mocking.mockStore();
        mocking.mockCrypto('cnt');
        view = cnt.CountingView();
        return storeMock.set('ballots',
            mocking.makeBallotsData('', 'a\nb\nc', ''));
    });

    afterEach(mocking.unmockAll);

    function makeBallotsCollected(votes) {
        var filledBallots = votes.map(function (vote, i) {
            i = String(i);
            return utils.fillBallot('bt' + i, 'vt' + i, vote, 'cnt');
        });
        return utils.collectBallots(filledBallots);
    }

    it('should decrypt and count', function () {
        view.resultsAvaliable().should.be.eql(false);
        return storeMock.set('ballots-collected',
            makeBallotsCollected(['a', 'b', 'b', 'EMPTY']))
        .then(function () {
            return view.count();
        })
        .then(function () {
            view.resultsAvaliable().should.be.eql(true);
            view.totals().should.be.eql([
                {option: 'b', votesCount: '2'},
                {option: 'a', votesCount: '1'},
                {option: 'c', votesCount: '0'}
            ]);
            view.votes().should.be.eql([
                {voterToken: 'vt0', vote: 'a'},
                {voterToken: 'vt1', vote: 'b'},
                {voterToken: 'vt2', vote: 'b'},
                {voterToken: 'vt3', vote: 'EMPTY'}
            ]);
        });
    });

});
