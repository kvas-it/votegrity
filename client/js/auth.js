/*
 * Authentication and access token tracking.
 */

(function (global) {

    'use strict';

    var registry = global.registry || {};
    global.registry = registry;

    var crypto = registry.crypto;
    var store = registry.store;
    var ui = registry.ui;
    var utils = registry.utils;

    var auth = registry.auth = {};

    /* Set password and calculate access token. */
    auth.setPassword = function (password) {
        auth.password = password;
        auth.token = crypto.hash(auth.password);
        auth.htoken = crypto.hash(auth.token);
        store.setAccessToken(auth.token);
    };

    /* Try to authenticate with current access token. */
    auth.authenticate = function () {
        return store.read('users')
            .then(function success(usersData) {
                var users = utils.parseUsersData(usersData);
                auth.user = users.filter(function (u) {
                    return u.htoken === auth.htoken;
                })[0];
                auth.displayUser();
                if (!auth.user) {
                    throw Error('Unknown user');
                }
            });
    };

    /* Set password, try to authenticate.
     * Go to UI on success or to login form on error. */
    auth.uiAuthenticate = function (password) {

        auth.setPassword(password);

        return auth.authenticate().then(
            function success() {
                ui.hideError();
                ui.switchToState('main');
            },
            function error(err) {
                ui.reportError(err);
                ui.switchToState('auth-form');
            });
    };

    /* Show current user in the UI. */
    auth.displayUser = function () {
        if (auth.user) {
            $('#logout-button').show();
            $('#user-info').html(
                    'Logged in as ' + auth.user.name +
                    ' (' + auth.user.role + ')');
        } else {
            $('#logout-button').hide();
            $('#user-info').html('Anonymous');
        }
    };

    /* Handle login form submit. */
    auth.loginSubmit = function () {
        return auth.uiAuthenticate($('#password-input').val());
    };

    /* Log out current user. */
    auth.logoutSubmit = function () {
        auth.password = auth.token = auth.htoken = auth.user = undefined;
        store.setAccessToken('');
        auth.displayUser();
        ui.switchToState('auth-form');
    };

    $(document).ready(function () {
        $('#login-form').submit(function (ev) {
            auth.loginSubmit();
            ev.preventDefault();
        });
        $('#logout-button').click(auth.logoutSubmit);
    });
})(this);
