/*
 * Votegrity ui utilities.
 */

(function (registry) {

    'use strict';

    var ui = registry.ui = {};

    ui.switchableDivs = [];
    ui.switchableStates = {};

    ui.addSwitchableState = function (state, config) {
        ui.switchableStates[state] = config;
        config.divs.forEach(function (div) {
            if (ui.switchableDivs.indexOf(div) === -1) {
                ui.switchableDivs.push(div);
            }
        });
    };

    ui.switchToState = function (state) {
        if (state in ui.switchableStates) {
            ui.currentState = state;
            var stateConfig = ui.switchableStates[state];
            ui.switchableDivs.forEach(function (div) {
                var jqDiv = $('#' + div);
                if (stateConfig.divs.indexOf(div) === -1) {
                    jqDiv.hide();
                } else {
                    jqDiv.show();
                }
            });
            if (stateConfig.onEnter) {
                stateConfig.onEnter();
            }
        }
    };

    ui.reportError = function (err) {
        console.log(err);
        var msg = err.message;
        if (msg === 'Access denied' || msg === 'Unknown user') {
            msg = 'Authentication failed';
        } else if (msg === 'Request failed') {
            msg = 'Server not available';
        } else if (msg === 'Missing key: users') {
            msg = 'Access control not configured';
        }
        $('#error-message').html(msg);
        $('#error').show();
    };

    ui.hideError = function () {
        $('#error').hide();
    };

    $(document).ready(function () {
        ui.addSwitchableState('loading', {divs: ['loading']});
        ui.addSwitchableState('main', {divs: ['main']});
        ui.switchToState('loading');
    });
})(this.registry);
