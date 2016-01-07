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
        var usersData = '1:TUrDi0FcAiT2i2KmNx/z5tqR3+w6n9:john@doe.com:John Doe:moderator';
        var accessToken = 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6';

        return store.write('users', usersData)
            .then(function () {
                return store.read('users')
                    .then(function () {
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
