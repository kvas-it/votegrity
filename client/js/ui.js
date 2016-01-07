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

    ui.fillMenu = function (items) {
        $('#menu').html(items.map(function (item) {
            return '<a class="menu-item' +
                (item.state === ui.currentState ? ' selected' : '') +
                '" href="#">' + item.name + '</a>';
        }).join('\n') + '&nbsp;');

        $('#menu > a').each(function (i, element) {
            var item = items[i];
            if (item.state && !item.func) {
                item.func = ui.stateSwitcher(item.state);
            }
            $(element).click(item.func);
        });
    };

    ui.stateSwitcher = function (state) {
        return function (ev) {
            ui.switchToState(state);
            ev.preventDefault();
        };
    };

    ui.switchToState = function (state) {
        if (state in ui.switchableStates && state !== ui.currentState) {
            ui.hideError();
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
            ui.fillMenu(stateConfig.menu || []);
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
        if (ui.hideErrorTimeout) {
            clearTimeout(ui.hideErrorTimeout);
        }
        ui.hideErrorTimeout = setTimeout(ui.hideError, 20000);
    };

    ui.hideError = function () {
        $('#error').hide();
        if (ui.hideErrorTimeout) {
            clearTimeout(ui.hideErrorTimeout);
            ui.hideErrorTimeout = undefined;
        }
    };

    $(document).ready(function () {
        ui.addSwitchableState('loading', {divs: ['loading']});
        ui.addSwitchableState('main', {
            divs: [],
            onEnter: function () {
                var user = registry.auth.user;
                var role = user ? user.role : 'anonymous';
                if (role === 'moderator') {
                    ui.switchToState('mod-main');
                } else if (user.role === 'counter') {
                    ui.switchToState('cnt-main');
                } else if (user.role === 'voter') {
                    ui.switchToState('vot-main');
                } else {
                    ui.switchToState('auth-form');
                }
            }
        });
        ui.switchToState('loading');
    });
})(this.registry);
