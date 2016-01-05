/*
 * General utils.
 */

(function (global) {

    'use strict';

    var registry = global.registry || {};
    global.registry = registry;

    var utils = registry.utils = {};

    /* Extract access token from URL and remove it from location. */
    utils.extractAccessTokenFromUrl = function () {
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
    };

    /* Parse user data from the server. */
    utils.parseUsersData = function (data) {
        var lines = data.split('\n')
                .filter(function (line) {
                    return line && line[0] !== '#';
                });
        return lines.map(function (line) {
            var fields = line.split(':');
            return {
                htoken: fields[0],
                email: fields[1],
                name: fields[2],
                role: fields[3]
            };
        });
    };

})(this);
