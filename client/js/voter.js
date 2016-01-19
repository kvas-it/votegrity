/*
 * Voter UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var store = registry.store;
    var ui = registry.ui;
    var auth = registry.auth;
    var vot = registry.vot = {};

    vot.VotingInfo = function (ballotIssuanceInfo) {

        var bii = ballotIssuanceInfo;
        var self = {
            user: ko.pureComputed(function () {
                return auth.user();
            })
        };

        self.userId = utils.koAttr(self.user, 'id');

        self.ballotToken = ko.pureComputed(function () {
            var userId = self.userId();
            return store.getKeyValue('ballot-' + userId);
        });

        self.haveBallot = ko.pureComputed(function () {

            var token = self.ballotToken();
            var allTokens = bii.ballotTokens();

            if (token) {
                if (allTokens.indexOf(token) === -1) {
                    return 'CHECK FAILED';
                } else {
                    return true;
                }
            } else {
                return false;
            }
        });

        return self;
    };

    vot.VotingView = function () {

        var users = registry.mod.UsersInfo();
        var bii = registry.cnt.BallotIssuanceInfo(users);
        var voi = vot.VotingInfo(bii);
        var self = {
            haveBallot: voi.haveBallot
        };

        return self;

    };

    vot.View = function () {

        var self = {
            activeViewName: ko.observable('main')
        };

        ui.setSubViews(self, {
            main: function () {return {};},
            voting: vot.VotingView,
            results: vot.ResultsView
        });

        self.menuItems = ui.makeMenu(self, [
            {name: 'Vote', view: 'voting'},
            {name: 'View results', view: 'results'}
        ]);

        return self;
    };

})(this.registry);
