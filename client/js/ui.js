/*
 * Votegrity ui utilities.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;

    var ui = registry.ui = {};

    ui.Switch = function (id, config) {
        this.id = id;
        this.e_id = id + '-enable';
        this.d_id = id + '-disable';
        this.config = config;
        this.text = $('#' + id).html().split(':')[0];
    };

    ui.Switch.prototype.load = function () {

        function button(id, text) {
            return '<button id="' + id + '">' + text + '</button>';
        }

        return this.config.load()
            .then(function (state) {
                var div = $('#' + this.id);
                if (state) {
                    div.html(this.text + ': enabled ' +
                        button(this.d_id, 'disable'));
                    $('#' + this.d_id).click(this.disable.bind(this));
                } else {
                    div.html(this.text + ': disabled ' +
                        button(this.e_id, 'enable'));
                    $('#' + this.e_id).click(this.enable.bind(this));
                }

            }.bind(this));
    };

    ui.Switch.prototype.enable = function () {
        return this.config.enable().then(this.load.bind(this));
    };

    ui.Switch.prototype.disable = function () {
        return this.config.disable().then(this.load.bind(this));
    };

    ui.stateDivs = [];
    ui.states = {};

    ui.addState = function (state, config) {
        ui.states[state] = config;
        config.divs.forEach(function (div) {
            if (ui.stateDivs.indexOf(div) === -1) {
                ui.stateDivs.push(div);
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
                item.func = ui.stateSetter(item.state);
            }
            $(element).click(item.func);
        });
    };

    ui.stateSetter = function (state) {
        return function (ev) {
            ui.setState(state);
            ev.preventDefault();
        };
    };

    ui.setState = function (state) {
        if (state in ui.states && state !== ui.currentState) {
            ui.hideError();
            ui.currentState = state;
            ui.currentStateScope = {};
            var stateConfig = ui.states[state];
            ui.stateDivs.forEach(function (div) {
                var jqDiv = $('#' + div);
                if (stateConfig.divs.indexOf(div) === -1) {
                    jqDiv.hide();
                } else {
                    jqDiv.show();
                }
            });
            ui.fillMenu(stateConfig.menu || []);
            if (stateConfig.onEnter) {
                return utils.pResolve(stateConfig.onEnter(ui.currentStateScope))
                    .fail(function (err) {ui.reportError(err);})
                    .then(function () {return true;});
            } else {
                return utils.pResolve(true);
            }
        } else {
            return utils.pResolve(false);
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
        ui.addState('loading', {divs: ['loading']});
        ui.addState('main', {
            divs: [],
            onEnter: function () {
                var user = registry.auth.user;
                var role = user ? user.role : 'anonymous';
                if (role === 'moderator') {
                    ui.setState('mod-main');
                } else if (user.role === 'counter') {
                    ui.setState('cnt-main');
                } else if (user.role === 'voter') {
                    ui.setState('vot-main');
                } else {
                    ui.setState('auth-form');
                }
            }
        });
        ui.setState('loading');
    });
})(this.registry);
