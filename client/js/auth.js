/*
 * Authentication and access token tracking.
 */

(function (registry) {

    'use strict';

    var crypto = registry.crypto;
    var store = registry.store;
    var utils = registry.utils;

    var auth = registry.auth = {};

    /* Set password and calculate access token. */
    auth.setPassword = function (password) {
        auth.password = password;
        auth.token = crypto.hash(auth.password);
        auth.htoken = crypto.hash(auth.token);
        store.setAccessToken(auth.token);
    };

    /* Log out. */
    auth.logOut = function () {
        auth.password = undefined;
        auth.token = undefined;
        auth.htoken = undefined;
        store.setAccessToken(undefined);
    };

    /* Authenticate with password. */
    auth.authenticate = function (password) {
        auth.setPassword(password);
        store.loadKey('users');
        return store.all().users._promise;
    };

    /* Compute current logged in user. */
    auth.user = ko.pureComputed(function () {
        var usersKey = store.all().users;
        var usersList = usersKey ? usersKey.value() : undefined;

        if (usersList) {
            var users = utils.parseUserList(usersList);
            return users.filter(function (u) {
                return u.htoken === auth.htoken;
            })[0];
        }
    });

    /* Initialise crypto with password from authentication. */
    auth.initKeys = function () {
        if (crypto.keyPair || !auth.password) {
            return;
        }
        return crypto.initKeys(auth.password);
    };

    /* Authenticate with the password from URL. */
    auth.init = function () {
        var token = utils.extractPasswordFromUrl();
        if (token !== undefined) {
            return auth.authenticate(token);
        }
    };

    auth.View = function () {

        var self = {
            password: ko.observable()
        };

        self.logIn = function () {
            auth.authenticate(self.password());
        };

        self.status = ko.pureComputed(function () {
            var users = store.all().users;
            if (!users) {
                return '';
            }
            switch (users.status()) {
                case 'loading...':
                    return 'authenticating...';
                case 'missing':
                    return 'authentication not set up';
                case 'no access':
                    return 'authentication failed';
                case 'disconnected':
                    return 'disconnected';
                default:
                    return '';
            }
        });

        return self;
    };

})(this.registry);
