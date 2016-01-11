/*
 * Tests for keygen module.
 */

describe('Keygen', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var crypto = window.registry.crypto;
    var keygen = window.registry.keygen;

    var password = '123456789012345678901234567890';
    var publcInfo =
        'htoken: xqNr9s59YJg0oMvBqSlGG//SC9cWo7\n\n' +
        'public key:\n' +
        'vH6VAH7RdZVwhnVyp4ijBpD1rM8PH8ZPwL3s5c6ecPiMP+Keg4V0W3ub1Ej\n' +
        'mbGcxsN8/FmZNMkl6k434W+pKYtEpd5bM7rme2GQ2lPc3qYGEKzTojZZAc6\n' +
        'rvqIOp8pPISCbsD2Uxka4dFgWNFEdx7FtSRojAU0Mww+D2CV7Vpgs=';
    var view;

    before(function () {
        mocking.mock('crypto.genToken', function () {
            return password;
        });
        mocking.mock('crypto.initKeys', function () {
            crypto.keySize.should.be.eql(1024);
            crypto.publicKey =
                'vH6VAH7RdZVwhnVyp4ijBpD1rM8PH8ZPwL3s5c6ecPiMP+Keg4V0W3ub1Ej' +
                'mbGcxsN8/FmZNMkl6k434W+pKYtEpd5bM7rme2GQ2lPc3qYGEKzTojZZAc6' +
                'rvqIOp8pPISCbsD2Uxka4dFgWNFEdx7FtSRojAU0Mww+D2CV7Vpgs=';
        });
        view = keygen.View();
    });

    after(mocking.unmockAll);

    it('should generate password and key', function () {
        view.generate();
        view.password().should.be.eql(password);
        view.publicInfo().should.be.eql(publcInfo);
    });
});
