/*
 * Counter UI.
 */

(function (registry) {

    'use strict';

    var cnst = registry.cnst;
    var utils = registry.utils;
    var crypto = registry.crypto;
    var store = registry.store;
    var ui = registry.ui;
    var auth = registry.auth;

    var cnt = registry.cnt = {};

    cnt.makeTokens = function (count) {
        var tokens = [];
        for (var i = 0; i < count; i++) {
            tokens.push(crypto.genToken());
        }
        return tokens;
    };

    cnt.BallotIssuanceInfo = function (usersInfo) {

        var self = {};

        /* Flag for ballot issuance. */
        self.enabled = ko.pureComputed(function () {
            var acl = store.getKeyValue('ballots.acl', '');
            return acl.indexOf('counter:write') !== -1;
        });

        /* Raw content of ``ballots`` key (normally signed by counter). */
        self.ballotsData = store.getKeyObservable('ballots', '');

        /* Ballots bundle with signature checked and removed. */
        self.ballotsText = ko.pureComputed(function () {
            var data = self.ballotsData();
            var cntPK = usersInfo.counterPubKey();
            try {
                return data ? crypto.signed2plain(data, cntPK) : '';
            } catch (err) {
                return 'CHECK FAILED';
            }
        });

        /* Components of ballots bundle: text, options, tokens. */
        self.ballotTextParts = ko.pureComputed(function () {
            var text = self.ballotsText();
            if (text) {
                var t = text.split(cnst.ballotsSeparator);
                if (t.length === 3) {
                    return t;
                }
            }
            return [];
        });

        /* Vote description. */
        self.voteInfo = utils.koAttr(self.ballotTextParts, 0, '');

        /* The ballot tokens as an array. */
        self.ballotTokens = ko.pureComputed(function () {
            var tokensText = self.ballotTextParts()[2];
            if (tokensText) {
                return tokensText.split('\n');
            } else {
                return [];
            }
        });

        /* Count of the ballot tokens. */
        self.ballotsCount = utils.koLength(self.ballotTokens);

        self.votingOptions = ko.pureComputed(function () {
            var optionsText = self.ballotTextParts()[1];
            if (optionsText) {
                return optionsText.split('\n');
            } else {
                return [];
            }
        });

        return self;
    };

    cnt.BallotIssuanceView = function () {

        var users = registry.mod.UsersInfo();
        var bii = cnt.BallotIssuanceInfo(users);
        var bdi = registry.mod.BallotDistributionInfo(users, bii);

        var self = {
            unlocked: ko.observable(false),
            voteFinished: bdi.ballotsCollectedFlag
        };

        self.votersCount = users.votersCount;
        self.ballotsCount = bii.ballotsCount;
        self.issuanceEnabled = bii.enabled;

        self.ballotsError = ko.pureComputed(function () {
            return bii.ballotsText() === 'CHECK FAILED';
        });

        self.status = ko.computed(function () {
            if (self.voteFinished()) {
                return 'vote finished';
            } else if (self.ballotsError()) {
                return 'signature check error';
            } else {
                return self.issuanceEnabled() ? 'enabled' : 'disabled';
            }
        });

        self.toIssue = ko.computed(function () {
            return self.votersCount() - self.ballotsCount();
        });

        self.canIssue = ko.computed(function () {
            return !self.ballotsError() &&
                    self.issuanceEnabled() &&
                    self.toIssue() > 0 &&
                    !self.voteFinished();
        });

        self.unlock = function () {
            this.unlocked(true);
        };

        /* Issue ballots (from scratch or add to already issued). */
        self.issueBallots = function (count) {

            auth.initKeys();

            var tokens = bii.ballotTokens().concat(cnt.makeTokens(count));
            var ballotsModel = store.getKeyModel('ballots');

            return utils.pJoin(
                store.getKeyValueP('voting-descr', ''),
                store.getKeyValueP('voting-options', ''),
                function (descr, options) {
                    var ballotsText = descr + cnst.ballotsSeparator +
                                      options + cnst.ballotsSeparator +
                                      tokens.join('\n');
                    var ballotsData = crypto.sign(ballotsText);

                    ballotsModel.value(ballotsData);
                    return ballotsModel.save();
                });
        };

        self.issueAll = function () {
            return self.issueBallots(self.toIssue());
        };

        self.issueOne = function () {
            return self.issueBallots(1);
        };

        return self;
    };

    cnt.ResultsInfo = function (users) {

        var self = {};

        self.resultsData = store.getKeyObservable('results', '');
        self.resultsText = ko.pureComputed(function () {
            var data = self.resultsData();
            var cntPK = users.counterPubKey();
            try {
                return data ? crypto.signed2plain(data, cntPK) : '';
            } catch (err) {
                return 'CHECK FAILED';
            }
        });

        self.resultsFlag = ko.pureComputed(function () {
            var text = self.resultsText();
            return text && text !== 'CHECK FAILED' ? true : false;
        });

        self.resultsParts = ko.pureComputed(function () {
            if (self.resultsFlag()) {
                return self.resultsText().split(cnst.ballotsSeparator);
            }
        });

        self.totals = ko.pureComputed(function () {
            if (self.resultsFlag()) {
                return utils.parseData(self.resultsParts()[0],
                    ['option', 'votesCount']);
            }
        });

        self.votes = ko.pureComputed(function () {
            if (self.resultsFlag()) {
                return utils.parseData(self.resultsParts()[1],
                    ['voterToken', 'vote']);
            }
        });

        return self;
    };

    /* Counting view. */
    cnt.CountingView = function () {

        var users = registry.mod.UsersInfo();
        var bii = cnt.BallotIssuanceInfo(users);
        var bdi = registry.mod.BallotDistributionInfo(users, bii);
        var res = cnt.ResultsInfo(users);

        var self = {
            ballotsCollectedCount: bdi.ballotsCollectedCount,
            voteFinished: bdi.ballotsCollectedFlag,
            resultsAvaliable: res.resultsFlag,
            totals: res.totals,
            votes: res.votes
        };

        self.canCount = ko.pureComputed(function () {
            return self.voteFinished() &&
                    !self.resultsAvaliable() &&
                    bii.votingOptions() !== [];
        });

        self.count = function () {
            auth.initKeys();
            var filledBallots = bdi.ballotsCollected();
            var options = bii.votingOptions();
            var votes = utils.unpackBallots(filledBallots);
            var results = utils.calculateResults(options, votes);
            var data = utils.makeResults(votes, results);
            return store.write('results', data)
                .then(function () {
                    store.loadKey('results', true);
                });
        };

        return self;
    };

    cnt.View = function () {

        var self = {
            activeViewName: ko.observable('main')
        };

        ui.setSubViews(self, {
            main: function () {return {};},
            ballots: cnt.BallotIssuanceView,
            counting: cnt.CountingView
        });

        self.menuItems = ui.makeMenu(self, [
            {name: 'Ballots issuance', view: 'ballots'},
            {name: 'Counting and publishing results', view: 'counting'}
        ]);

        return self;
    };

})(this.registry);
