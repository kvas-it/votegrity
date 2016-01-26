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
        var bdi = registry.mod.BallotDistributionInfo(users, bii);
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
            if (bdi.ballotsCollectedFlag()) {
                return 'vote finished';
            } else if (self.voted()) {
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
            return bdi.ballotsCollectedFlag() === false &&
                self.haveBallot() === true &&
                state !== 'already voted';
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

            var encrText = utils.fillBallot(
                    voi.ballotToken(),
                    self.voterToken(),
                    self.vote(),
                    users.counterPubKey());

            return store.write(voi.filledBallotKey(), encrText)
                .then(function () {
                    return utils.pAll([
                        store.loadKey(voi.filledBallotKey(), true),
                        store.loadKey('ballots-in', true)
                    ]);
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

    vot.ParticipantsView = function () {

        var users = registry.mod.UsersInfo();

        function nameEmail(user) {
            if (user) {
                return {name: user.name, email: user.email};
            } else {
                return {name: '', email: ''};
            }
        }

        function filterByRole(role, users) {
            return users.filter(function (u) {
                return u.role === role;
            });
        }

        function koOneByRole(role) {
            return ko.pureComputed(function () {
                return nameEmail(filterByRole(role, users.userList())[0]);
            });
        }

        function koAllByRole(role) {
            return ko.pureComputed(function () {
                var recs = filterByRole(role, users.userList()).map(nameEmail);
                return utils.sortBy(recs, 'name');
            });
        }

        var self = {
            moderator: koOneByRole('moderator'),
            counter: koOneByRole('counter'),
            voters: koAllByRole('voter')
        };

        self.votersListItems = ko.pureComputed(function () {
            return self.voters().map(function (v) {
                return '<li>' + v.name +
                       '&lt;' + v.email + '&gt;' + '</li>';
            }).join('\n');
        });

        return self;
    };

    vot.ProgressView = function () {

        var users = registry.mod.UsersInfo();
        var bii = registry.cnt.BallotIssuanceInfo(users);
        var bdi = registry.mod.BallotDistributionInfo(users, bii);

        return {
            usedBallots: bdi.ballotsIn,
            voteFinished: bdi.ballotsCollectedFlag
        };
    };

    vot.ResultsView = function () {

        var users = registry.mod.UsersInfo();
        var res = registry.cnt.ResultsInfo(users);

        return {
            resultsAvaliable: res.resultsFlag,
            totals: res.totals,
            votes: res.votes
        };
    };

    vot.View = function () {

        var self = {
            activeViewName: ko.observable('voting')
        };

        ui.setSubViews(self, {
            voting: vot.VotingView,
            participants: vot.ParticipantsView,
            progress: vot.ProgressView,
            results: vot.ResultsView
        });

        self.menuItems = ui.makeMenu(self, [
            {name: 'Vote', view: 'voting'},
            {name: 'Participants', view: 'participants'},
            {name: 'Progress', view: 'progress'},
            {name: 'Results', view: 'results'}
        ]);

        return self;
    };

})(this.registry);
