/*
 * Cryptographic utils.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;

    var crypto = registry.crypto = {};

    crypto.sha256 = window.SHA256; // From internals of cryptico.

    crypto.keySize = 1024;
    crypto.keyPair = null;
    crypto.publicKey = null;
    crypto.separator = '\n==[separator]==[uJkYpCKc2wdDr0Il8XSOdrSgyEump]==\n';

    /* SHA256 -> BASE64 -> truncate to 30 */
    crypto.hash = function (plainText) {
        return cryptico.b16to64(crypto.sha256(plainText)).substr(0, 30);
    };

    crypto.genToken = function () {
        return crypto.hash(Math.seedrandom());
    };

    crypto.setKeySize = function (size) {
        crypto.keySize = size;
    };

    crypto.initKeys = function (password) {
        crypto.keyPair = cryptico.generateRSAKey(password, crypto.keySize);
        crypto.publicKey = cryptico.publicKeyString(crypto.keyPair);
    };

    crypto.makeSignature = function (plainText) {
        return cryptico.b16to64(crypto.keyPair.signString(plainText, 'sha256'));
    };

    crypto.verifySignature = function (plainText, signature, publicKey) {
        var key = cryptico.publicKeyFromString(publicKey);
        return key.verifyString(plainText, cryptico.b64to16(signature));
    };

    crypto.sign = function (plainText) {
        return plainText + crypto.separator +
            crypto.publicKey + crypto.separator +
            crypto.makeSignature(plainText);
    };

    crypto.parseSignedText = function (signedText) {
        var t = signedText.split(crypto.separator);
        if (t.length !== 3) {
            throw Error('Invalid signed text');
        }
        return {
            plainText: t[0],
            publicKey: utils.unwrapData(t[1]),
            signature: utils.unwrapData(t[2])
        };
    };

    crypto.signed2plain = function (signedText, publicKey) {
        var parsed = crypto.parseSignedText(signedText);
        if (parsed.publicKey !== utils.unwrapData(publicKey)) {
            throw Error('Wrong public key in signature');
        }
        if (
                !crypto.verifySignature(
                    parsed.plainText, parsed.signature, parsed.publicKey)) {
            throw Error('Signature verification failed');
        }
        return parsed.plainText;
    };

    crypto.encrypt = function (plainText, publicKey) {
        var result = cryptico.encrypt(plainText, publicKey);
        if (result.status !== 'success') {
            throw Error(result.status);
        }
        return result.cipher;
    };

    crypto.decrypt = function (cipherText) {
        var result = cryptico.decrypt(cipherText, crypto.keyPair);
        if (result.status !== 'success') {
            throw Error(result.status);
        }
        return result.plaintext;
    };

})(this.registry);
