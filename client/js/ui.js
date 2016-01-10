/*
 * Votegrity ui utilities.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;

    var ui = registry.ui = {};

    /*
     * Add ``activeView`` observable that will autoinstantiate current
     * view based on ``self.activeViewName()`` and proxy observables
     * for all the subviews.
     */
    ui.setSubViews = function (self, viewMap) {

        self.activeView = ko.pureComputed(function () {
            var name = self.activeViewName();
            var constructor = viewMap[name];

            if (constructor) {
                return constructor(self);
            }
        });

        function makeSubviewProxy(name) {
            return ko.pureComputed(function () {
                var activeView = self.activeView();
                if (self.activeViewName() === name) {
                    return activeView;
                }
            });
        }

        for (var name in viewMap) {
            self[name] = makeSubviewProxy(name);
        }
    };

    /* Make the list of menu items for subviews. */
    ui.makeMenu = function (self, items) {
        return ko.observable(items.map(function (item) {
            return {
                name: item.name,
                action: function () {
                    self.activeViewName(item.view);
                }
            };
        }));
    };

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

    ui.TextBox = function (id, config) {
        this.id = id;
        this.status = $('#' + id + '-status');
        this.saveButton = $('#' + id + '-save');
        this.saveButton.click(function () {
            this.save();
        }.bind(this));
        this.textarea = $('#' + id + '-content');
        this.config = config;
    };

    ui.TextBox.prototype.load = function () {
        var self = this;
        self.status.html('(loading...)');
        return self.config.load()
            .then(function (content) {
                self.textarea.val(content || '');
                self.status.html('(checking access...)');
                return utils.pResolve(self.config.isDisabled(content || ''))
                    .then(function (dis) {
                        self.textarea.attr('disabled', dis ? true : false);
                        self.saveButton.css('display',
                            dis ? 'none' : 'inline-block');

                        if (content === undefined) {
                            self.status.html('(missing)');
                        } else if (dis) {
                            self.status.html('(read only)');
                        } else {
                            self.status.html('');
                        }
                    });
            })
            .fail(function (err) {
                ui.reportError(err);
                self.status.html('(load failed)');
                self.saveButton.css('display', 'inline-block');
            });
    };

    ui.TextBox.prototype.save = function () {
        var self = this;
        self.saveButton.css('display', 'none');
        self.status.html('(saving...)');
        return self.config.save(self.textarea.val())
            .then(self.load.bind(self))
            .fail(function (err) {
                ui.reportError(err);
                self.status.html('(save failed)');
                self.saveButton.css('display', 'inline-block');
            });
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
        items.each(function (item) {
            if (item.state && !item.action) {
                item.action = ui.stateSetter(item.state);
            }
        });
        ui.view.navbar.menuItems(items);
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

})(this.registry);
