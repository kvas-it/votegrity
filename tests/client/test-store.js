/*
 * Tests for votegrity store client.
 */

describe('Store client', function () {

    'use strict';

    var store = window.registry.store;

    beforeEach(function () {
        store.setBaseUrl('http://localhost:3000');
        store.setAccessToken('dummy');
    });

    afterEach(function () {
        store.setAccessToken(undefined);
    });

    it('should write and read', function () {
        return store.write('a1', '123')
            .then(function () {
                return store.read('a1');
            })
            .then(function (got) {
                got.should.be.eql('123');
            });
    });

    it('should report server unavailability', function () {
        store.setBaseUrl('http://localhost:3001');
        return store.read('a1')
            .then(function () {
                throw Error('Dead server not noticed');
            },
            function (err) {
                err.message.should.be.eql('Request failed');
            });
    });

    it('should pass the access token', function () {
        var usersData = '1:TUrDi0FcAiT2i2KmNx/z5tqR3+w6n9:' +
                        'john@doe.com:John Doe:moderator';
        var accessToken = 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6';

        return store.write('users', usersData)
            .then(function () {
                return store.read('users').then(function () {
                    throw Error('Still can access');
                },
                function (err) {
                    err.message.should.be.eql('Access denied');
                });
            })
            .then(function () {
                store.setAccessToken(accessToken);
                return store.read('users')
                    .then(function (data) {
                        data.should.be.eql(usersData);
                    });
            })
            .then(function () {
                return store.write('users', '');
            });
    });
});

describe('Store key model', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;
    var store = window.registry.store;

    var data;
    var dataP;
    var saveP;

    var key;

    afterEach(mocking.unmockAll);

    beforeEach(function () {
        data = '42';
        dataP = utils.pResolve('42');
        saveP = utils.pResolve(true);

        mocking.mock('store.read', function () {
            return dataP;
        });
        mocking.mock('store.write', function (key, value) {
            return saveP.then(function () {
                data = value;
                dataP = utils.pResolve(value);
            });
        });

        key = store.Key('foo');
        return key._promise; // Wait for the key to load.
    });

    it('should load the value', function () {
        key.value().should.be.eql('42');
        key.loadedValue().should.be.eql('42');
        key.loading().should.be.eql(false);
        (key.error() === null).should.be;

        dataP = utils.pResolve('43');
        return key.load()
            .then(function () {
                key.value().should.be.eql('43');
            });
    });

    it('should save the value', function () {
        key.value('45');
        return key.save()
            .then(function () {
                data.should.be.eql('45');
                key.loadedValue().should.be.eql('45');
                key.saving().should.be.eql(false);
                (key.error() === null).should.be.ok;
            });
    });

    it('should show status', function () {
        var dataD = ayepromise.defer();
        dataP = dataD.promise;
        var saveD = ayepromise.defer();
        saveP = saveD.promise;

        key.status().should.be.eql('');
        key.value('45');
        key.status().should.be.eql('modified');
        key.save();
        key.status().should.be.eql('saving...');
        saveD.resolve(true);
        return utils.pDelay(1)
            .then(function () {
                key.status().should.be.eql('loading...');
                dataD.resolve('45');
                return utils.pDelay(1);
            })
            .then(function () {
                key.status().should.be.eql('');
            });
    });

    it('should report disconnect', function () {
        var dataD = ayepromise.defer();
        dataP = dataD.promise;

        key.load();
        dataD.reject(Error('Request failed'));
        return key._promise
            .then(function () {
                key.error().should.be.eql('Request failed');
                key.status().should.be.eql('disconnected');
            });
    });

    it('should report access denied', function () {
        var saveD = ayepromise.defer();
        saveP = saveD.promise;

        key.save();
        saveD.reject(Error('Access denied'));
        return key._promise
            .then(function () {
                key.error().should.be.eql('Access denied');
                key.status().should.be.eql('no access');
            });
    });

    it('should report missing key', function () {
        var dataD = ayepromise.defer();
        dataP = dataD.promise;

        key.load();
        dataD.resolve(undefined);
        return key._promise
            .then(function () {
                key.status().should.be.eql('missing');
            });
    });
});

describe('Store key map', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var store = window.registry.store;

    afterEach(mocking.unmockAll);

    beforeEach(function () {
        mocking.mock('store.Key', function (key) {
            return {key: key};
        });
        store.setAccessToken(undefined); // Reset the key map.
    });

    it('should track the keys', function () {
        store.all().should.be.eql({});
        store.loadKey('a');
        store.all().should.be.eql({a: {key: 'a'}});
        store.loadKey('b');
        store.all().should.be.eql({a: {key: 'a'}, b: {key: 'b'}});
    });

    it('should not recreate the keys', function () {
        var counter = 0;
        var tracker = ko.computed(function () {
            store.all();
            counter++;
        });
        tracker();
        var before = counter;

        store.loadKey('a');
        var a1 = store.all().a;
        store.loadKey('a');
        var a2 = store.all().a;

        (a1 === a2).should.be.ok;
        // store.all should only be updated once.
        counter.should.be.eql(before + 1);
    });

    it('should reset key map when access token changes', function () {
        store.loadKey('a');
        store.setAccessToken(undefined);
        store.all().should.be.eql({});
    });

});

describe('Store value observable', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var store = window.registry.store;

    var storeMock;
    var a;

    beforeEach(function () {
        storeMock = mocking.mockStore();
        a = store.getKeyObservable('a');
        return storeMock.set('a', '123');
    });

    afterEach(mocking.unmockAll);

    it('should load the value', function () {
        a().should.be.eql('123');
    });

    it('should update the value', function () {
        return storeMock.set('a', '456')
            .then(function () {
                a().should.be.eql('456');
            });
    });

    it('should return default value', function () {
        var b = store.getKeyObservable('b', '789');
        b().should.be.eql('789');
        return storeMock.set('b', '456')
            .then(function () {
                b().should.be.eql('456');
            });
    });
});
