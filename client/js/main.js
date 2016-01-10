/*
 * Votegrity client main module.
 */

(function (registry) {

    'use strict';

    var ui = registry.ui;
    var keygen = registry.keygen;
    var auth = registry.auth;
    var mod = registry.mod;
    var cnt = registry.cnt;
    var vot = registry.vot;

    var main = registry.main = {};

    /* KO model of the navigation bar. */
    main.Navbar = function (parent) {

        var self = {
            userInfo: ko.pureComputed(function () {
                var user = auth.user();
                if (user) {
                    return 'Logged in as ' + user.name + ' (' + user.role + ')';
                } else {
                    return 'Anonymous';
                }
            }),
            isLoggedIn: ko.pureComputed(function () {
                return auth.user() !== undefined;
            })
        };

        self.menuItems = ko.pureComputed(function () {
            return parent.menuItems();
        });

        self.logOut = auth.logOut;

        return self;
    };

    /* KO model of the top level view. */
    main.View = function () {

        var self = {
            errorMessage: ko.observable()
        };

        self.activeViewName = ko.pureComputed(function () {
            var user = auth.user();
            if (user) {
                return user.role;
            } else {
                if (window.location.href.indexOf('/keygen') !== -1) {
                    return 'keygen';
                } else {
                    return 'auth';
                }
            }
        });

        ui.setSubViews(self, {
            keygen: keygen.View,
            auth: auth.View,
            moderator: mod.View,
            counter: cnt.View,
            voter: vot.View
        });

        self.menuItems = ko.pureComputed(function () {
            var activeView = self.activeView();

            if (activeView && activeView.menuItems) {
                return activeView.menuItems() || [];
            } else {
                return [];
            }
        });

        self.navbar = main.Navbar(self);

        return self;
    };

    $(document).ready(function () {
        main.view = main.View();
        ko.applyBindings(main.view);
    });

})(this.registry);
