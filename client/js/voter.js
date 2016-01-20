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

        self.filledBallot = ko.pureComputed(function () {
            var key = self.filledBallotKey();
            return store.getKeyValue(key);
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
            info: bii.voteInfo,
            options: bii.votingOptions,
            ballotToken: voi.ballotToken,
            voterToken: ko.observable(''),
            vote: ko.observable(),
            voted: ko.pureComputed(function () {
                return voi.filledBallot() !== undefined;
            }),
            votedError: ko.observable(false),
            disconnected: ko.observable(false)
        };

        self.state = ko.pureComputed(function () {
            if (self.voted()) {
                if (self.voterToken()) {
                    return 'voted';
                } else {
                    return 'already voted';
                }
            } else if (self.disconnected()) {
                return 'disconnected';
            } else if (self.votedError()) {
                return 'already voted error';
            } else if (!self.haveBallot()) {
                return 'no ballot';
            } else if (self.haveBallot() === 'CHECK FAILED') {
                return 'invalid ballot';
            } else {
                return '';
            }
        });

        self.showVoting = ko.pureComputed(function () {
            var state = self.state();
            return self.haveBallot() === true && state !== 'already voted';
        });

        self.enableOptions = ko.pureComputed(function () {
            return self.state() === '';
        });

        self.enableSubmit = ko.pureComputed(function () {
            return self.state() === '' && self.vote();
        });

        self.submit = function () {

            if (!self.vote()) {
                return utils.pAll([]);
            }

            self.voterToken(crypto.genToken());

            var voteText = [
                voi.ballotToken(),
                self.voterToken(),
                self.vote()
            ].join('\n');
            var encrText = crypto.encrypt(voteText, users.counterPubKey());
            return store.write(voi.filledBallotKey(), encrText)
                .then(function () {
                    return store.loadKey(voi.filledBallotKey(), true);
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
            activeViewName: ko.observable('voting')
        };

        ui.setSubViews(self, {
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
