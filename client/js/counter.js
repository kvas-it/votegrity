/*
 * Counter UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var crypto = registry.crypto;
    var store = registry.store;
    var ui = registry.ui;
    var auth = registry.auth;

    var cnt = registry.cnt = {};

    cnt.separator = '\n==[separator]==[OcaC4P7HUg5g8t8aJdcnwhhC]==\n';

    cnt.ballotsData = store.getKeyObservable('ballots', '');

    /* Ballots bundle with signature checked and removed. */
    cnt.ballotsText = ko.pureComputed(function () {
        var data = cnt.ballotsData();
        var cntPK = registry.mod.counterPubKey();

        try {
            return data ? crypto.signed2plain(data, cntPK) : '';
        } catch (err) {
            return 'CHECK FAILED';
        }
    });

    /* Just the ballot tokens as an array. */
    cnt.ballotTokens = ko.pureComputed(function () {
        var text = cnt.ballotsText();

        if (text) {
            var t = text.split(cnt.separator);
            if (t.length !== 3) {
                return [];
            }
            return t[2].split('\n');
        } else {
            return [];
        }
    });

    /* Count of the ballot tokens. */
    cnt.ballotsCount = ko.pureComputed(function () {
        return cnt.ballotTokens().length;
    });

    cnt.makeTokens = function (count) {
        var tokens = [];
        for (var i = 0; i < count; i++) {
            tokens.push(crypto.genToken());
        }
        return tokens;
    };

    cnt.issueBallots = function (count) {
        var ballotsModel = store.getKeyModel('ballots');

        auth.initKeys();

        var tokens = cnt.ballotTokens().concat(cnt.makeTokens(count));

        return utils.pJoin(
            store.getKeyValueP('voting-descr', ''),
            store.getKeyValueP('voting-options', ''),
            function (descr, options) {
                var ballotsText = descr + cnt.separator +
                                  options + cnt.separator +
                                  tokens.join('\n');
                var ballotsData = crypto.sign(ballotsText);

                ballotsModel.value(ballotsData);
                return ballotsModel.save();
            });
    };

    cnt.BallotIssuance = function () {

        var self = {
            issuanceEnabled: registry.mod.ballotIssuanceEnabled,
            votersCount: registry.mod.votersCount,
            ballotsError: ko.pureComputed(function () {
                return cnt.ballotsText() === 'CHECK FAILED';
            }),
            ballotsCount: cnt.ballotsCount,
            unlocked: ko.observable(false)
        };

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

        self.issueAll = function () {
            return cnt.issueBallots(self.toIssue());
        };

        self.issueOne = function () {
            return cnt.issueBallots(1);
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
