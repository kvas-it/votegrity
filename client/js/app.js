/*
 * Votegrity client.
 */

'use strict';

(function () {
    function helloWorld() {
        if (!cryptico) {
            return 'Cryptico not found.';
        }

        var password = 'Ash nazg thrakatuluk agh burzum-ishi krimpatul';
        var bits = 512;

        var key = cryptico.generateRSAKey(password, bits);
        var keyString = cryptico.publicKeyString(key);

        var plainText = 'Hello world!';
        var cipherText = cryptico.encrypt(plainText, keyString).cipher;

        return cryptico.decrypt(cipherText, key).plaintext;
    }

    window.votegrity = {
        helloWorld: helloWorld
    };
})();
