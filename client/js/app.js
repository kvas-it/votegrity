/*
 * Votegrity client main module.
 */

(function (global) {

    'use strict';

    var registry = global.registry || {};
    global.registry = registry;

    var auth = registry.auth;
    var ui = registry.ui;
    var utils = registry.utils;

    var main = registry.main = {};

    /* Initialise the votegrity client. */
    main.init = function () {
        var token = utils.extractAccessTokenFromUrl();
        if (token !== undefined) {
            auth.uiAuthenticate(token);
        } else {
            ui.switchToState('auth-form');
        }
    };

    $(document).ready(main.init);
})(this);
