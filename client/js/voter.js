/*
 * Voter UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var crypto = registry.crypto;
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

        self.ballotKey = ko.pureComputed(function () {
            return 'ballot-' + self.userId();
        });

        self.filledBallotKey = ko.pureComputed(function () {
            return self.ballotKey() + '-filled';
        });

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
            haveBallot: voi.haveBallot,
            votingOptions: bii.votingOptions,
            voterToken: ko.observable(''),
            voted: ko.observable(false),
            noTokenError: ko.observable(false),
            votedError: ko.observable(false),
            disconnected: ko.observable(false)
        };

        self.state = ko.pureComputed(function () {
            if (self.voted()) {
                return 'voted';
            } else if (self.disconnected()) {
                return 'disconnected';
            } else if (self.votedError()) {
                return 'already voted';
            } else if (!self.haveBallot()) {
                return 'no ballot';
            } else if (self.haveBallot() === 'CHECK FAILED') {
                return 'invalid ballot';
            } else if (self.noTokenError()) {
                return 'no token error';
            } else if (!self.voterToken()) {
                return 'no token';
            } else {
                return '';
            }
        });

        self.genVoterToken = function () {
            self.voterToken(crypto.genToken());
        };

        self.vote = function (vote) {
            if (!self.voterToken()) {
                self.noTokenError(true);
                return utils.pAll([]);
            }
            var voteText = [voi.ballotToken(), self.voterToken(), vote].join('\n');
            var encrText = crypto.encrypt(voteText, users.counterPubKey());
            return store.write(voi.filledBallotKey(), encrText)
                .then(function () {
                    self.voted(true);
                },
                function fail(err) {
                    if (err.message === 'Access denied') {
                        self.votedError(true);
                    } else if (err.message === 'Request failed') {
                        self.disconnected(true);
                    }
                });
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
