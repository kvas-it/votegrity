/*
 * Votegrity ui utilities.
 */

(function (global) {

    'use strict';

    var registry = global.registry || {};
    global.registry = registry;

    var ui = registry.ui = {};

    ui.switchableDivs = ['auth-form', 'loading'];
    ui.switchableStates = {
        'auth-form': ['auth-form'],
        loading: ['loading'],
        main: ['main']
    };
    ui.currentState = 'loading';

    ui.switchToState = function (state) {
        if (state in ui.switchableStates) {
            ui.currentState = state;
            var stateDivs = ui.switchableStates[state];
            ui.switchableDivs.forEach(function (divId) {
                var div = $('#' + divId);
                if (stateDivs.indexOf(divId) === -1) {
                    div.hide();
                } else {
                    div.show();
                }
            });
        }
    };

    ui.reportError = function (err) {
        console.log(err);
        var msg = err.message;
        if (msg === 'Access denied' || msg === 'Unknown user') {
            msg = 'Authentication failed';
        } else if (msg === 'Missing key: users') {
            msg = 'Access control not configured';
        }
        $('#error-message').html(msg);
        $('#error').show();
    };

    ui.hideError = function () {
        $('#error').hide();
    };
})(this);
