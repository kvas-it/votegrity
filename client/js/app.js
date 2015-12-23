/*
 * Votegrity client.
 */

'use strict';

function helloWorld() {
    if (!cryptico) {
        return 'Cryptico not found.';
    }

    var password = 'Ash nazg thrakatuluk agh burzum-ishi krimpatul'; 
    var bits = 2048;

    var key = cryptico.generateRSAKey(password, bits);
    var keyString = cryptico.publicKeyString(key);

    console.log('key:', keyString);

    var plainText = 'Hello world!';
    var cipherText = cryptico.encrypt(plainText, keyString).cipher;

    console.log('encrypted:', cipherText);

    return cryptico.decrypt(cipherText, key).plaintext;
}
