/*
 * Tests for votegrity store client.
 */

describe('Store client', function () {

    beforeEach(function () {
        votegrityStore.setBaseUrl('http://localhost:3000');
        votegrityStore.setAccessToken('dummy');
    });

    it('should write and read', function () {
        return votegrityStore.write('a1', '123')
            .then(function () {
                return votegrityStore.read('a1');
            })
            .then(function (got) {
                got.should.be.eql('123');
            });
    });

    it('should pass the access token', function () {
        var usersData = 'TUrDi0FcAiT2i2KmNx/z5tqR3+w6n9:john@doe.com:John Doe:moderator';
        var accessToken = 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6';

        return votegrityStore.write('users', usersData)
            .then(function () {
                return votegrityStore.read('users')
                    .then(function () {
                        throw Error('Still can access');
                    },
                    function (err) {
                        err.message.should.be.eql('Access denied');
                    });
            })
            .then(function () {
                votegrityStore.setAccessToken(accessToken);
                return votegrityStore.read('users')
                    .then(function (data) {
                        data.should.be.eql(usersData);
                    });
            })
            .then(function () {
                return votegrityStore.write('users', '');
            });
    });
});
