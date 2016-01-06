/*
 * Tests for crypto utils.
 */

describe('Crypto utils', function () {

    'use strict';

    var crypto = window.registry.crypto;

    it('should calculate hashes', function () {
        crypto.hash('123').should.be.eql('pmWkWSBCL51Bfkhn79xPuKBKHz//H6');
    });

    it('should generate random tokens', function () {
        var t1 = crypto.genToken();
        var t2 = crypto.genToken();
        t1.length.should.be.eql(30);
        t2.length.should.be.eql(30);
        (t1 === t2).should.be.eql(false);
    });

    it('should produce keys from passwords', function () {
        var password = '123';
        var expectPK = 'pq0sdhitYqNjnRXInJwfXGz+8pSBEl9TtgHUxssQBqIccrvT9' +
                       'UFgLAL4G+T5Xt0VrC7ib2vxru2bCBFiWY5mjQ==';
        crypto.setKeySize(512);
        crypto.initKeys(password);
        var gotPK = crypto.publicKey;
        gotPK.should.be.eql(expectPK);
    });
});

