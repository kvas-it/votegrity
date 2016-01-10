/*
 * Counter UI.
 */

(function (registry) {

    'use strict';

    // var store = registry.store;
    var ui = registry.ui;

    var cnt = registry.cnt = {};

    cnt.BallotIssuance = function () {

        var self = {
            issuanceEnabled: registry.mod.ballotIssuanceEnabled,
            votersCount: ko.pureComputed(function () {
                return registry.mod.voterList().length;
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
