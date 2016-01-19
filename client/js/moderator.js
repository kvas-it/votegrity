/*
 * Moderator UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var crypto = registry.crypto;
    var ui = registry.ui;
    var store = registry.store;

    var mod = registry.mod = {};

    /* Variable networks. */

    mod.UsersInfo = function () {

        var self = {};

        self.userList = ko.pureComputed(function () {
            return utils.parseUserList(store.getKeyValue('users', ''));
        });

        self.voterList = ko.pureComputed(function () {
            return self.userList()
                .filter(function (u) {return u.role === 'voter';})
                .sort(function (a, b) {return Number(a.id) - Number(b.id);});
        });

        self.votersCount = ko.pureComputed(function () {
            return self.voterList().length;
        });

        self.moderatorPubKey = store.getKeyObservable('key-moderator', '');
        self.counterPubKey = store.getKeyObservable('key-counter', '');

        return self;
    };

    mod.BallotDistributionInfo = function (usersInfo, ballotIssuanceInfo) {

        var users = usersInfo;
        var bii = ballotIssuanceInfo;

        var self = {};

        self.ballotState = store.getKeyObservable('ballots-state', '');

        self.ballotStates = ko.pureComputed(function () {
            var data = self.ballotState();
            return utils.parseData(data, ['id', 'token', 'state']);
        });

        self.distrBallotsCount = ko.pureComputed(function () {
            return self.ballotStates().length;
        });

        self.remainingBallots = ko.pureComputed(function () {
            var distributed = {};
            self.ballotStates().forEach(function (bs) {
                distributed[bs.token] = 1;
            });
            return bii.ballotTokens().filter(function (token) {
                return !(token in distributed);
            });
        });

        self.remainingVoters = ko.pureComputed(function () {
            var withBallots = {};
            self.ballotStates().forEach(function (bs) {
                withBallots[bs.id] = 1;
            });
            return users.voterList().filter(function (voter) {
                return !(voter.id in withBallots);
            });
        });

        return self;
    };

    /* Views. */

    mod.PublicKeyEditor = function (key) {

        var keyModel = store.getKeyModel(key);
        var aclModel = store.getKeyModel(key + '.acl');

        return {
            value: keyModel.value,
            status: keyModel.status,
            save: function () {
                aclModel.value('*:read');
                return utils.pAll([keyModel.save(), aclModel.save()]);
            },
            editable: ko.pureComputed(function () {
                var lv = keyModel.loadedValue() || '';
                return lv.length < 100;
            })
        };
    };

    mod.KeyManagementView = function () {
        return {
            moderatorKey: mod.PublicKeyEditor('key-moderator'),
            counterKey: mod.PublicKeyEditor('key-counter'),
        };
    };

    mod.VoterAdder = function (usersInfo) {

        var usersModel = store.getKeyModel('users');
        var initPasswordsModel = store.getKeyModel('init-passwords');

        var self = {
            newVoters: ko.observable(''),
            error: ko.observable(''),
        };

        self.editable = ko.pureComputed(function () {
            return true;
        });

        self.status = ko.pureComputed(function () {
            if (self.error()) {
                return self.error();
            } else {
                return usersModel.status();
            }
        });

        self.createVoters = function (votersData) {

            var votersList = utils.parseData(votersData, ['name', 'email']);
            if (votersList.length === 0) {
                throw Error('No voter information supplied');
            }

            var userList = usersInfo.userList();
            var maxId = Math.max.apply(null, userList.map(function (u) {
                return Number(u.id);
            }));

            var existingEmails = {};
            userList.forEach(function (u) {
                existingEmails[u.email] = 1;
            });

            return votersList
                .map(function adjust(v) {
                    v.name = $.trim(v.name);
                    v.email = $.trim(v.email);
                    if (v.name === '') {
                        throw Error('Empty name in one of voter records');
                    }
                    if (v.email === '') {
                        throw Error('Empty email in one of voter records');
                    }
                    if (v.email.indexOf('@') === -1) {
                        throw Error('Invalid email: ' + v.email);
                    }
                    if (v.email in existingEmails) {
                        throw Error('Duplicate email: ' + v.email);
                    }
                    existingEmails[v.email] = 1;
                    return v;
                })
                .map(function (v) {
                    var id = String(++maxId);
                    var password = crypto.genToken();
                    var htoken = crypto.hash(crypto.hash(password));
                    return {
                        pwRec: [id, password].join(':'),
                        userRec: [id, htoken, v.email, v.name, 'voter'].join(':')
                    };
                });
        };

        self.save = function () {
            self.error('');
            try {
                var usersData = usersModel.value() || '';
                var initPWData = initPasswordsModel.value() || '';
                var created = self.createVoters(self.newVoters());
                var records = created.map(function (v) {return v.userRec;});
                var pws = created.map(function (v) {return v.pwRec;});

                usersModel.value(usersData + '\n' + records.join('\n'));
                initPasswordsModel.value(initPWData + '\n' + pws.join('\n'));

                return utils.pAll([
                    usersModel.save(),
                    initPasswordsModel.save()
                ])
                .then(function () {
                    if (!usersModel.error()) {
                        self.newVoters('');
                    }
                });
            } catch (err) {
                console.log(err);
                self.error(err.message);
                return utils.pResolve();
            }
        };

        return self;
    };

    mod.VotersView = function () {

        var users = mod.UsersInfo();

        return {
            votersList: ko.pureComputed(function () {
                return users.voterList().map(function (v) {
                    return v.id + '. ' + v.name + ' &lt;' + v.email + '&gt;';
                }).join('<br/>\n');
            }),
            voterAdder: mod.VoterAdder(users)
        };
    };

    mod.VotingInfoView = function () {

        var users = mod.UsersInfo();
        var bii = registry.cnt.BallotIssuanceInfo(users);

        function makeEditor(key) {
            return ko.computed(function () {
                var keyModel = store.getKeyModel(key);
                var aclModel = store.getKeyModel(key + '.acl');
                return {
                    value: keyModel.value,
                    status: keyModel.status,
                    save: function () {
                        aclModel.value('*:read');
                        return utils.pAll([keyModel.save(), aclModel.save()]);
                    },
                    editable: ko.pureComputed(function () {
                        return bii.ballotsCount() === 0;
                    })
                };
            });
        }

        return {
            generalInfo: makeEditor('voting-descr'),
            votingOptions: makeEditor('voting-options')
        };
    };

    mod.IssuanceSwitch = function (ballotIssuanceInfo) {

        var bii = ballotIssuanceInfo;
        var ballotsACLModel = store.getKeyModel('ballots.acl');

        var self = {
            enabled: bii.enabled,
            disabled: ko.pureComputed(function () {
                return !bii.enabled();
            }),
            status: ko.pureComputed(function () {
                return bii.enabled() ? 'enabled' : 'disabled';
            })
        };

        self.enable = function () {
            ballotsACLModel.value('*:read\ncounter:write');
            return ballotsACLModel.save();
        };

        self.disable = function () {
            ballotsACLModel.value('*:read');
            return ballotsACLModel.save();
        };

        return self;
    };

    mod.BallotsView = function () {

        var users = mod.UsersInfo();
        var bii = registry.cnt.BallotIssuanceInfo(users);
        var bdi = mod.BallotDistributionInfo(users, bii);

        var self = {
            issuanceSwitch: mod.IssuanceSwitch(bii),
            votersCount: users.votersCount,
            ballotsCount: bii.ballotsCount,
            distrBallotsCount: bdi.distrBallotsCount
        };

        self.remainingVotersCount = ko.pureComputed(function () {
            return self.votersCount() - self.distrBallotsCount();
        });

        self.remainingBallotsCount = ko.pureComputed(function () {
            return self.ballotsCount() - self.distrBallotsCount();
        });

        self.ballotsToDistribute = ko.pureComputed(function () {
            return Math.min(self.remainingVotersCount(),
                            self.remainingBallotsCount());
        });

        self.canDistribute = ko.pureComputed(function () {
            return self.ballotsToDistribute() > 0;
        });

        self.distributeBallots = function () {

            var ballots = bdi.remainingBallots();
            var voters = bdi.remainingVoters();
            var count = self.ballotsToDistribute();

            var promise = utils.pResolve();

            function distributeOne(id, ballot) {
                promise = promise.then(function () {
                    return utils.pAll([
                        store.write('ballot-' + id, ballot),
                        store.write('ballot-' + id + '.acl', id + ':read')
                    ]);
                });
            }

            for (var i = 0; i < count; i++) {
                distributeOne(voters[i].id, ballots[i]);
            }

            return promise.then(function () {
                return store.loadKey('ballots-state', true);
            });
        };

        return self;
    };

    mod.View = function () {

        var self = {
            activeViewName: ko.observable('main')
        };

        ui.setSubViews(self, {
            main: function () {return {};},
            keys: mod.KeyManagementView,
            voters: mod.VotersView,
            info: mod.VotingInfoView,
            ballots: mod.BallotsView
        });

        self.menuItems = ui.makeMenu(self, [
            {name: 'Key management', view: 'keys'},
            {name: 'Voter list', view: 'voters'},
            {name: 'Voting configuration', view: 'info'},
            {name: 'Ballot management', view: 'ballots'}
        ]);

        return self;
    };

})(this.registry);
