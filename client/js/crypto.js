/*
 * Cryptographic utils.
 */

(function (registry) {

    'use strict';

    var crypto = registry.crypto = {};

    crypto.sha256 = window.SHA256; // From internals of cryptico.

    crypto.keySize = 1024;
    crypto.keyPair = null;
    crypto.publicKey = null;

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

})(this.registry);
