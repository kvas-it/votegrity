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

    /* Extract auth token from URL and remove it from location. */
    function extractAuthTokenFromUrl() {
        var url = window.location.href;
        var parts = url.split('?');
        var base = parts[0];
        var qs = parts[1];
        if (!qs) {return;}
        var fields = qs.split('&');
        var token;
        fields.forEach(function (f) {
            var t = f.split('=');
            var name = t[0];
            var value = t[1];
            if (name === 'auth') {
                token = value;
            }
        });
        try {
            var title = $('title').text();
            window.history.replaceState(title, title, base);
        } catch (err) {
            console.log('Old browser :(');
        }
        return token;
    }

    /* Check the auth token and store it for further requests to server. */
    function setAuthToken(token) {
        console.log('setAuthToken', token);
        // get the user list from server and see what role we have.
        // if everything is ok, store it to global authToken.
    }

    /* Initialise the votegrity client. */
    function init() {
        var token = extractAuthTokenFromUrl();
        if (token !== undefined) {
            setAuthToken(token);
        }
    }

    /* Handle authentication form submit. */
    function authSubmit() {
        var token = $('#auth-token-input').value;
        setAuthToken(token);
    }

    window.votegrity = {
        authSubmit: authSubmit,
        helloWorld: helloWorld,
        init: init,
        setAuthToken: setAuthToken
    };
})();
