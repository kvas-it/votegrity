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

        this.issuanceEnabled = ko.observable(false);
        this.votersCount = ko.observable(0);
        this.ballotsCount = ko.observable(0);
        this.unlocked = ko.observable(false);

        this.status = ko.computed(function () {
            return this.issuanceEnabled() ? 'enabled' : 'disabled';
        }, this);

        this.toIssue = ko.computed(function () {
            return this.votersCount() - this.ballotsCount();
        }, this);

        this.canIssue = ko.computed(function () {
            return this.issuanceEnabled() && (this.toIssue() > 0);
        }, this);
    };

    cnt.BallotIssuance.loadVotersCount = function () {
        return store.read('users', '').then(function (userList) {
            var users = utils.parseUserList(userList);
            return users.filter(function (u) {return u.role === 'voter';}).length;
        });
    };

    cnt.BallotIssuance.loadBallotsCount = function () {
        return store.read('ballots', '').then(function (ballots) {
            return 0 && ballots;
        });
    };

    cnt.BallotIssuance.loadIssuanceEnabled = function () {
        return store.read('ballots.acl', '').then(function (acl) {
            return acl.indexOf('counter:write') !== -1;
        });
    };

    cnt.BallotIssuance.prototype.load = function () {
        var self = this;
        return utils.pAll([
            self.loadVotersCount().then(self.votersCount),
            self.loadBallotsCount().then(self.ballotsCount),
            self.loadIssuanceEnabled().then(self.issuanceEnabled)
        ]);
    };

    cnt.BallotIssuance.prototype.unlock = function () {
        this.unlocked(true);
    };

    cnt.BallotIssuance.prototype.issue = function () {
        window.alert('yo!');
    };

    $(document).ready(function () {
        var cntMenu = [
            {name: 'Ballots issuance', state: 'cnt-ballots'},
            {name: 'Counting and publishing results', state: 'cnt-count'}
        ];
        ui.addState('cnt-main', {
            divs: ['cnt-main'],
            menu: cntMenu
        });
        ui.addState('cnt-ballots', {
            divs: ['cnt-ballots'],
            menu: cntMenu,
            onEnter: function (scope) {
                scope.bi = new cnt.BallotIssuance();
                ko.applyBindings(scope.bi);
                scope.bi.load();
            }
        });
        ui.addState('cnt-count', {
            divs: ['cnt-count'],
            menu: cntMenu
        });
    });

})(this.registry);
