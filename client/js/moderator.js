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

    /* Commonly used observables. */

    mod.userList = ko.pureComputed(function () {
        return utils.parseUserList(store.getKeyValue('users', ''));
    });

    mod.ballotIssuanceEnabled = ko.pureComputed(function () {
        var acl = store.getKeyValue('ballots.acl', '');
        return acl.indexOf('counter:write') !== -1;
    });

    mod.voterList = ko.pureComputed(function () {
        return mod.userList()
            .filter(function (u) {return u.role === 'voter';})
            .sort(function (a, b) {return Number(a.id) - Number(b.id);});
    });
    mod.votersCount = ko.pureComputed(function () {
        return mod.voterList().length;
    });

    mod.moderatorPubKey = store.getKeyObservable('key-moderator', '');
    mod.counterPubKey = store.getKeyObservable('key-counter', '');

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

    mod.KeyManagement = function () {
        return {
            moderatorKey: mod.PublicKeyEditor('key-moderator'),
            counterKey: mod.PublicKeyEditor('key-counter'),
        };
    };

    /* Create voters and return their user records and passwords. */
    function createVoters(votersData) {

        var votersList = utils.parseData(votersData, ['name', 'email']);
        if (votersList.length === 0) {
            throw Error('No voter information supplied');
        }

        var userList = mod.userList();
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
    }

    mod.VoterAdder = function () {

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

        self.save = function () {
            self.error('');
            try {
                var usersData = usersModel.value() || '';
                var initPWData = initPasswordsModel.value() || '';
                var created = createVoters(self.newVoters());
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

    mod.Voters = function () {
        return {
            votersList: ko.pureComputed(function () {
                return mod.voterList().map(function (v) {
                    return v.id + '. ' + v.name + ' &lt;' + v.email + '&gt;';
                }).join('<br/>\n');
            }),
            voterAdder: mod.VoterAdder()
        };
    };

    mod.VotingInfoEditor = function (key) {
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
                    return !mod.ballotIssuanceEnabled() &&
                           registry.cnt.ballotsCount() === 0;
                })
            };
        });
    };

    mod.VotingInfo = function () {
        return {
            generalInfo: mod.VotingInfoEditor('voting-descr'),
            votingOptions: mod.VotingInfoEditor('voting-options')
        };
    };

    mod.IssuanceSwitch = function () {

        var ballotsACLModel = store.getKeyModel('ballots.acl');

        var self = {
            enabled: mod.ballotIssuanceEnabled,
            disabled: ko.pureComputed(function () {
                return !mod.ballotIssuanceEnabled();
            }),
            status: ko.pureComputed(function () {
                return mod.ballotIssuanceEnabled() ? 'enabled' : 'disabled';
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

    mod.ballotState = store.getKeyObservable('ballot-state', '');
    mod.ballotStates = ko.pureComputed(function () {
        var data = mod.ballotState();
        return utils.parseData(data, ['id', 'token', 'state']);
    });

    mod.distributeBallot = function (voterId, ballotToken) {
        return utils.pAll([
            store.write('ballot-' + voterId, ballotToken),
            store.write('ballot-' + voterId + '.acl', voterId + ':read')
        ]);
    };

    mod.Ballots = function () {

        var self = {
            issuanceSwitch: mod.IssuanceSwitch(),
            votersCount: mod.votersCount,
            ballotsCount: registry.cnt.ballotsCount,
            distrBallotsCount: ko.pureComputed(function () {
                return mod.ballotStates().length;
            })
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

            var tokens = registry.cnt.ballotTokens();
            var voters = mod.voterList();
            var count = Math.min(tokens.length, voters.length);
            var promise = utils.pResolve(0);

            function makeDistributor(id, token) {
                return function () {
                    return mod.distributeBallot(id, token);
                };
            }

            for (var i = 0; i < count; i++) {
                promise = promise.then(makeDistributor(voters[i].id, tokens[i]));
            }

            return promise.then(function () {
                return store.loadKey('ballot-state', true);
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
            keys: mod.KeyManagement,
            voters: mod.Voters,
            info: mod.VotingInfo,
            ballots: mod.Ballots
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
