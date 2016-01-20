/*
 * Tests for crypto utils.
 */

describe('Crypto utils', function () {

    'use strict';

    var crypto = window.registry.crypto;

    var password = '123';
    var rightPK = 'pq0sdhitYqNjnRXInJwfXGz+8pSBEl9TtgHUxssQBqIccrvT9' +
                   'UFgLAL4G+T5Xt0VrC7ib2vxru2bCBFiWY5mjQ==';
    var wrappedPK = window.registry.utils.wrapData(rightPK, 50);
    var plainText = 'Marry had a little lamb.';
    var rightSig = 'EgFzGq6QeOcZuJwz+nVMLRf2R3z9cdnvyN302wnqogsoWr67' +
                    'sz49fXOKV692xz/4BCDJhLYgu6ijFO5k0nK89w==';

    before(function () {
        crypto.setKeySize(512);
        crypto.initKeys(password);
    });

    it('should calculate hashes', function () {
        crypto.hash('123').should.be.eql('pmWkWSBCL51Bfkhn79xPuKBKHzH6Bm');
    });

    it('should generate random tokens', function () {
        var t1 = crypto.genToken();
        var t2 = crypto.genToken();
        t1.length.should.be.eql(30);
        t2.length.should.be.eql(30);
        (t1 === t2).should.be.eql(false);
    });

    it('should produce keys from passwords', function () {
        var gotPK = crypto.publicKey;
        gotPK.should.be.eql(rightPK);
    });

    it('should make signatures', function () {
        var signature = crypto.makeSignature(plainText);
        signature.should.be.eql(rightSig);
    });

    it('should verify signatures', function () {
        var verified = crypto.verifySignature(plainText, rightSig, rightPK);
        verified.should.be.eql(true);

        var unverified = crypto.verifySignature('other', rightSig, rightPK);
        unverified.should.be.eql(false);
    });

    it('should sign plaintext', function () {
        var signed = crypto.sign(plainText);
        var got = crypto.signed2plain(signed, wrappedPK);
        got.should.be.eql(plainText);
    });

    it('should spot wrong pk', function () {
        var signed = crypto.sign(plainText);
        var wrongPK = rightSig;
        try {
            crypto.signed2plain(signed, wrongPK);
            throw Error('Forgery not noticed');
        } catch (err) {
            err.message.should.be.eql('Wrong public key in signature');
        }
    });

    it('should spot forgery', function () {
        var signed = 'Invalid ' + crypto.sign(plainText);
        try {
            crypto.signed2plain(signed, wrappedPK);
            throw Error('Forgery not noticed');
        } catch (err) {
            err.message.should.be.eql('Signature verification failed');
        }
    });

    it('should encrypt and decrypt', function () {
        var cipherText = crypto.encrypt(plainText, wrappedPK);
        var got = crypto.decrypt(cipherText);
        got.should.be.eql(plainText);
    });
});

