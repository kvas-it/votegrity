/*
 * Votegrity client main module.
 */

(function (registry) {

    'use strict';

    var auth = registry.auth;
    var ui = registry.ui;

    $(document).ready(function () {
        auth.init();
        if (window.location.href.indexOf('/keygen') !== -1) {
            ui.setState('keygen');
        }
    });
})(this.registry);
