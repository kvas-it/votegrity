/*
 * Tests for voter ui.
 */

describe('Voting UI', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var crypto = window.registry.crypto;
    var utils = window.registry.utils;
    var vot = window.registry.vot;

    var users = '1:x:a@b.c:A:moderator\n5:y:b@c.d:B:voter\n8:z:c@d.e:C:voter';
    var storeMock;
    var view;

    beforeEach(function () {
        storeMock = mocking.mockStore();
        mocking.mockCrypto('123');
        mocking.mock('auth.htoken', 'y'); // Authenticate as 5.
        mocking.mock('crypto.genToken', function () {
            return 'abc';
        });
        view = vot.VotingView();
        return storeMock.setMany({
            'key-counter': 'cntkey',
            users: users,
            ballots: mocking.makeBallotsData('', 'a\nb', 'A')
        });
    });

    afterEach(mocking.unmockAll);

    it('should indicate that the ballot is not distributed', function () {
        view.haveBallot().should.be.eql(false);
        view.showVoting().should.be.eql(false);
        view.state().should.be.eql('no ballot');
    });

    it('should indicate that the ballot is distributed', function () {
        return storeMock.set('ballot-5', 'A')
        .then(function () {
            view.haveBallot().should.be.eql(true);
            view.showVoting().should.be.eql(true);
            view.state().should.be.eql('');
        });
    });

    it('should detect invalid ballot', function () {
        return storeMock.set('ballot-5', 'B')
        .then(function () {
            view.haveBallot().should.be.eql('CHECK FAILED');
            view.showVoting().should.be.eql(false);
            view.state().should.be.eql('invalid ballot');
        });
    });

    it('should detect invalid ballot list', function () {
        return storeMock.setMany({
            ballots: mocking.makeBallotsData('', '', 'A') + ' fake',
            'ballot-5': 'A'
        })
        .then(function () {
            view.haveBallot().should.be.eql('CHECK FAILED');
            view.state().should.be.eql('invalid ballot');
            view.options().should.be.eql([]);
        });
    });

    it('should get voting options', function () {
        view.options().should.be.eql(['a', 'b']);
    });

    it('should vote', function () {
        return storeMock.set('ballot-5', 'A')
        .then(function () {
            view.vote('a');
            return view.submit();
        })
        .then(function () {
            view.voterToken().should.be.eql('abc');
            view.state().should.be.eql('voted');
            storeMock.get('ballot-5-filled')
                .should.be.eql(crypto.encrypt('A\nabc\na', 'cntkey'));
        });
    });

    it('should vote only once', function () {
        mocking.mock('store.write', function () {
            return utils.pReject(Error('Access denied'));
        });
        return storeMock.set('ballot-5', 'A')
        .then(function () {
            view.vote('a');
            return view.submit();
        })
        .then(function () {
            view.state().should.be.eql('already voted error');
        });
    });

    it('should report already voted', function () {
        return storeMock.setMany({
            'ballot-5': 'A',
            'ballot-5-filled': 'filled'
        })
        .then(function () {
            view.state().should.be.eql('already voted');
            view.showVoting().should.be.eql(false);
        });
    });

    it('should report disconnection', function () {
        mocking.mock('store.write', function () {
            return utils.pReject(Error('Request failed'));
        });
        return storeMock.set('ballot-5', 'A')
        .then(function () {
            view.vote('a');
            return view.submit();
        })
        .then(function () {
            view.state().should.be.eql('disconnected');
        });
    });

    it('should allow empty votes', function () {
        return storeMock.set('ballot-5', 'A')
        .then(function () {
            view.vote('EMPTY');
            return view.submit();
        })
        .then(function () {
            view.state().should.be.eql('voted');
            storeMock.get('ballot-5-filled')
                .should.be.eql(crypto.encrypt('A\nabc\nEMPTY', 'cntkey'));
        });
    });

});
