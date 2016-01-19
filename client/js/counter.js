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

        var self = {unlocked: ko.observable(false)};

        var users = registry.mod.UsersInfo();
        var bii = cnt.BallotIssuanceInfo(users);

        self.votersCount = users.votersCount;
        self.ballotsCount = bii.ballotsCount;
        self.issuanceEnabled = bii.enabled;

        self.ballotsError = ko.pureComputed(function () {
            return bii.ballotsText() === 'CHECK FAILED';
        });

        self.status = ko.computed(function () {
            if (self.ballotsError()) {
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
                    self.toIssue() > 0;
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

    /* Counting view. */
    cnt.CountingView = function () {

        var self = {};

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
