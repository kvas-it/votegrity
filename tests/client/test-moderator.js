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
        view = mod.Voters();
    });

    afterEach(mocking.unmockAll);

    it('should load empty voters list', function () {
        return storeMock.set('users', list0)
            .then(function () {
                mod.voterList().length.should.be.eql(0);
            });
    });

    it('should load voters list', function () {
        return storeMock.set('users', list2)
            .then(function () {
                mod.voterList().length.should.be.eql(2);
            });
    });

    it('should add voters to the list', function () {
        return storeMock.set('users', list2)
            .then(function () {
                view.voterAdder.newVoters(newVoters);
                return view.voterAdder.save();
            })
            .then(function () {
                mod.voterList().length.should.be.eql(4);
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

// TODO: tests for ballot management.
