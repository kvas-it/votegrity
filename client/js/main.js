/*
 * Votegrity client main module.
 */

(function (global) {

    'use strict';

    var registry = global.registry;
    var auth = registry.auth;

    $(document).ready(function () {
        auth.init();
    });
})(this);
