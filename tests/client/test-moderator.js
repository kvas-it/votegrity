/*
 * Tests for moderator ui.
 */

describe('Key management', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var mod = window.registry.mod;

    var smallKey = '123';
    var bigKey = '1234567890'.split('')
            .map(function () {return '1234567890';})
            .join('');
    var storeMock;
    var view;

    beforeEach(function () {
        storeMock = mocking.mockStore();
        view = mod.PublicKeyEditor('key-moderator');
        return storeMock.set('key-moderator', smallKey);
    });

    afterEach(mocking.unmockAll);

    it('should load the key', function () {
        view.value().should.be.eql(smallKey);
        view.status().should.be.eql('');
        view.editable().should.be.eql(true);
        view.value(bigKey);
        view.editable().should.be.eql(true);
    });

    it('should disable editing if the key is big', function () {
        return storeMock.set('key-moderator', bigKey)
            .then(function () {
                view.editable().should.be.eql(false);
            });
    });

    it('should save the key', function () {
        view.value('567');
        return view.save()
            .then(function () {
                storeMock.get('key-moderator').should.be.eql('567');
                storeMock.get('key-moderator.acl').should.be.eql('*:read');
            });
    });

});

describe('Voter list editor', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var mod = window.registry.mod;

    var list0 = '1:x:a@b.c:A:moderator';
    var list2 = '1:x:a@b.c:A:moderator\n5:y:b@c.d:B:voter\n8:z:c@d.e:C:voter';
    var newVoters = 'D:d@e.f\nE:e@f.g';
    var storeMock;
    var view;

    beforeEach(function () {
        storeMock = mocking.mockStore();
        view = mod.VotersView();
    });

    afterEach(mocking.unmockAll);

    it('should load empty voters list', function () {
        return storeMock.set('users', list0)
            .then(function () {
                view.votersList().should.be.eql('');
            });
    });

    it('should load voters list', function () {
        return storeMock.set('users', list2)
            .then(function () {
                view.votersList().split('\n').length.should.be.eql(2);
            });
    });

    it('should add voters to the list', function () {
        return storeMock.set('users', list2)
            .then(function () {
                view.voterAdder.newVoters(newVoters);
                return view.voterAdder.save();
            })
            .then(function () {
                view.votersList().split('\n').length.should.be.eql(4);
                view.voterAdder.newVoters().should.be.eql('');
            });
    });

    it('should add init passwords for new users', function () {
        return storeMock.setMany({'init-passwords': '5:xxx', users: list2})
            .then(function () {
                view.voterAdder.newVoters(newVoters);
                return view.voterAdder.save();
            })
            .then(function () {
                storeMock.get('init-passwords').should.startWith('5:xxx\n9:');
            });
    });

    it('should detect duplicate emails', function () {
        mocking.mock('console.log');
        return storeMock.set('users', list2)
            .then(function () {
                view.voterAdder.newVoters('X:b@c.d');
                return view.voterAdder.save();
            })
            .then(function () {
                mocking.unmockAll(); // So the framework can report results.
                view.voterAdder.status().should.be.eql('Duplicate email: b@c.d');
                view.voterAdder.newVoters().should.not.be.eql('');
            });
    });
});

// TODO: tests for voting information.

describe('Ballot management', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var mod = window.registry.mod;
    var cnst = window.registry.cnst;
    var crypto = window.registry.crypto;
    var store = window.registry.store;

    var users = '1::::moderator\n' +
                '2::::voter\n' +
                '3::::voter\n' +
                '4::::voter\n' +
                '5::::voter';
    var storeMock;
    var view;

    beforeEach(function () {
        storeMock = mocking.mockStore();
        mocking.mockCrypto('123');
        return storeMock.setMany({
            users: users,
            ballots: mocking.makeBallotsData('', '', 'A\nB')
        })
        .then(function () {
            view = mod.BallotsView();
        });
    });

    afterEach(mocking.unmockAll);

    it('should display stats', function () {
        view.issuanceSwitch.enabled().should.be.eql(false);
        view.votersCount().should.be.eql(4);
        view.ballotsCount().should.be.eql(2);
        view.ballotsOutCount().should.be.eql(0);
        view.remainingVotersCount().should.be.eql(4);
        view.remainingBallotsCount().should.be.eql(2);
        view.ballotsToDistribute().should.be.eql(2);
        view.canDistribute().should.be.eql(true);
    });

    it('should enable ballot issuance', function () {
        return view.issuanceSwitch.enable().then(function () {
            view.issuanceSwitch.enabled().should.be.eql(true);
        });
    });

    it('should distribute ballots', function () {
        return view.distributeBallots().then(function () {
            storeMock.get('ballot-2').should.be.eql('A');
            storeMock.get('ballot-2.acl').should.be.eql('2:read');
            storeMock.get('ballot-3').should.be.eql('B');
            storeMock.get('ballot-3.acl').should.be.eql('3:read');
        });
    });

    it('should distribute ballots wisely', function () {
        return storeMock.setMany({
            ballots: mocking.makeBallotsData('', '', 'A\nB\nC'),
            'ballots-out': '3:B'
        })
        .then(function () {
            return view.distributeBallots();
        })
        .then(function () {
            storeMock.get('ballot-2').should.be.eql('A');
            storeMock.get('ballot-4').should.be.eql('C');
        });
    });

    it('should collect ballots', function () {
        view.ballotsCollectedFlag().should.be.eql(false);
        return storeMock.setMany({
            ballots: mocking.makeBallotsData('', '', 'A\nB\nC'),
            'ballots-out': '2:A\n3:B\n4:C',
            'ballots-in': 'A\nB',
            'ballot-2-filled': 'A filled',
            'ballot-3-filled': 'B filled'
        })
        .then(function () {
            return view.collectBallots();
        })
        .then(function () {
            var bcS = storeMock.get('ballots-collected');
            var bc = crypto.signed2plain(bcS);
            var ballots = bc.split(cnst.ballotsSeparator);
            ballots.sort();
            ballots.should.be.eql(['A filled', 'B filled']);
            storeMock.get('ballots-collected.acl').should.be.eql('*:read');
            view.ballotsCollectedFlag().should.be.eql(true);
        });
    });

    function fakeCollectedBallots(ballots, tail) {
        crypto.initKeys();
        var bcData = crypto.sign(ballots.join(cnst.ballotsSeparator));
        if (tail) {
            bcData += tail;
        }
        return storeMock.set('ballots-collected', bcData)
            .then(function () {
                return store.loadKey('ballots-collected', true);
            });
    }

    function makeBDI() {
        var users = mod.UsersInfo();
        var bii = window.registry.cnt.BallotIssuanceInfo(users);
        return mod.BallotDistributionInfo(users, bii);
    }

    it('should check and unpack collected ballots', function () {
        var bdi = makeBDI();
        return fakeCollectedBallots(['AAA', 'BBB']).then(function () {
            bdi.ballotsCollected().should.be.eql(['AAA', 'BBB']);
            bdi.ballotsCollectedFlag().should.be.eql(true);
            bdi.ballotsCollectedCount().should.be.eql(2);
        });
    });

    it('should detect fake collected ballots', function () {
        var bdi = makeBDI();
        return fakeCollectedBallots(['AAA'], 'boo').then(function () {
            (bdi.ballotsCollected() === undefined).should.be.eql(true);
            bdi.ballotsCollectedFlag().should.be.eql(false);
            (bdi.ballotsCollectedCount() === undefined).should.be.eql(true);
        });
    });

});
