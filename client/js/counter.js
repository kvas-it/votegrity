/*
 * Counter UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var store = registry.store;
    var ui = registry.ui;

    var cnt = registry.cnt = {};

    cnt.BallotIssuance = function () {

        var self = {
            issuanceEnabled: ko.pureComputed(function () {
                var acl = store.getKeyValue('ballots.acl');
                if (acl) {
                    return acl.indexOf('counter:write') !== -1;
                } else {
                    return false;
                }
            }),
            votersCount: ko.pureComputed(function () {
                var usersKey = store.all().users;
                var usersList = usersKey ? usersKey.value() : undefined;

                if (usersList) {
                    return utils.parseUserList(usersList).length;
                } else {
                    return 0;
                }
            }),
            ballotsCount: ko.observable(0),
            unlocked: ko.observable(false)
        };

        self.status = ko.computed(function () {
            return self.issuanceEnabled() ? 'enabled' : 'disabled';
        });

        self.toIssue = ko.computed(function () {
            return self.votersCount() - self.ballotsCount();
        });

        self.canIssue = ko.computed(function () {
            return self.issuanceEnabled() && (self.toIssue() > 0);
        });

        self.unlock = function () {
            this.unlocked(true);
        };

        self.issue = function () {
            window.alert('yo!');
        };

        return self;
    };

    cnt.Counting = function () {

        var self = {};

        return self;
    };

    cnt.View = function () {

        var self = {
            activeViewName: ko.observable('main')
        };

        ui.setSubViews(self, {
            main: function () {return {};},
            ballots: cnt.BallotIssuance,
            counting: cnt.Counting
        });

        self.menuItems = ui.makeMenu(self, [
            {name: 'Ballots issuance', view: 'ballots'},
            {name: 'Counting and publishing results', view: 'counting'}
        ]);

        return self;
    };

})(this.registry);
