/*
 * Tests for counter ui.
 */

describe('Ballot issuance', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var store = window.registry.store;
    var auth = window.registry.auth;
    var cnt = window.registry.cnt;

    var users = '1:x:a@b.c:A:moderator\n5:y:b@c.d:B:voter\n8:z:c@d.e:C:voter';
    var storeMock;
    var view;

    beforeEach(function () {
        mocking.mockCrypto();
        storeMock = mocking.mockStore();
        auth.authenticate('123'); // So crypto can be initialised.
        view = cnt.BallotIssuance();
        return storeMock.setMany({
            users: users,
            'voting-descr': 'AAA\nBBB\nCCC',
            'voting-options': '1\n2\n3',
            'ballots.acl': '*:read\ncounter:write'
        })
        .then(function () {
            // TODO: this should not be necessary!
            return store.loadKey('ballots', true);
        });
    });

    afterEach(mocking.unmockAll);

    it.skip('should compute parameters', function () {
        console.log('ballots:', storeMock.get('ballots'));
        console.log('ballots observable 1:', cnt.ballotsData());
        console.log('ballots observable 2:', cnt.ballotsText());
        console.log('tokens:', cnt.ballotTokens());
        // TODO: this fails at the moment and we need a redesign of
        // the variable network. It has to be separated out and
        // constructed explicitly, not implicitly during init.
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
