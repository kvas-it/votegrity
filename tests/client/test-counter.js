/*
 * Tests for counter ui.
 */

describe('Ballot issuance', function () {

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