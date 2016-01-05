/*
 * Cryptographic utils.
 */

(function (global) {

    'use strict';

    var registry = global.registry || {};
    global.registry = registry;

    var crypto = registry.crypto = {};

    crypto.sha256 = window.SHA256; // From internals of cryptico.

    /* SHA256 -> BASE64 -> truncate to 30 */
    crypto.hash = function (plainText) {
        return cryptico.b16to64(crypto.sha256(plainText)).substr(0, 30);
    };
})(this);