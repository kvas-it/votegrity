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

    /* Load voter list (return promise). */
    function getVoterList() {
        return store.read('users')
            .then(function (data) {
                var userList = utils.parseUserList(data);
                return userList
                    .filter(function (u) {return u.role === 'voter';})
                    .sort(function (a, b) {return Number(a.id) - Number(b.id);});
            });
    }

    /* Load voter list. */
    mod.loadVoterList = function () {
        var list = $('#mod-voter-list');
        return getVoterList()
            .then(function (voterList) {
                if (voterList.length === 0) {
                    list.html('<em>no voters</em>');
                } else {
                    list.html(voterList.map(function (v) {
                        return v.id + '. ' + v.name + ' &lt;' + v.email + '&gt;';
                    }).join('<br/>\n'));
                }
            });
    };

    /* Create voters and return their user records and passwords. */
    function createVoters(votersData, usersData) {

        var votersList = utils.parseData(votersData, ['name', 'email']);
        if (votersList.length === 0) {
            throw Error('No voter information supplied');
        }

        var userList = utils.parseUserList(usersData);
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

    /* Add voters to the voters list (create accounts). */
    mod.addVoters = function (votersData) {
        return utils.pJoin(
            store.read('users'),
            store.read('init-passwords')
                .fail(function () {return '';}),
            utils.pDelay(0),
            function (usersData, initPWData) {
                var created = createVoters(votersData, usersData);
                var records = created.map(function (v) {return v.userRec;});
                var pws = created.map(function (v) {return v.pwRec;});
                return utils.pAll([
                    store.write('users', usersData + '\n' + records.join('\n')),
                    store.write('init-passwords', initPWData + '\n' + pws.join('\n'))
                ]);
            });
    };

    /* Make permission switch that enables counter to edit a file. */
    function makeACLSwitch(id, key) {
        return new ui.Switch(id, {
            load: function () {
                return store.read(key, '')
                    .then(function (acl) {
                        return acl.indexOf('counter:write') !== -1;
                    });
            },
            enable: function () {
                return store.write(key, '*:read\ncounter:write');
            },
            disable: function () {
                return store.write(key, '*:read');
            }
        });
    }

    /* Make a textbox that is connected to a storage key. */
    function makeStorageConnectedTextBox(keyId, isDisabled) {
        return new ui.TextBox(keyId, {
            load: function () {
                return store.read(keyId, '');
            },
            save: function (content) {
                return utils.pAll([
                    store.write(keyId, content),
                    store.write(keyId + '.acl', '*:read')
                ]);
            },
            isDisabled: isDisabled
        });
    }

    /* Make a textbox for editing voting info. */
    function makeVotingInfoBox(keyId) {
        return makeStorageConnectedTextBox(keyId, function () {
            /* When counter can issue ballots, voting info can't be edited. */
            return store.read('ballots.acl', '')
                .then(function (acl) {
                    return acl.indexOf('counter:write') !== -1;
                });
        });
    }

    /* Make a textbox for editing a public key. */
    function makeKeyBox(keyId) {
        return makeStorageConnectedTextBox(keyId, function (content) {
            /* Once the key is entered we don't want to change it. */
            return content.length > 100;
        });
    }

    $(document).ready(function () {
        var modMenu = [
            {name: 'Key management', state: 'mod-keys'},
            {name: 'Voter list', state: 'mod-voters'},
            {name: 'Voting configuration', state: 'mod-voting-info'},
            {name: 'Ballot management', state: 'mod-ballots'}
        ];
        ui.addState('mod-main', {
            divs: ['mod-main'], menu: modMenu
        });
        ui.addState('mod-keys', {
            divs: ['mod-keys'],
            menu: modMenu,
            onEnter: function (scope) {
                scope.modKey = makeKeyBox('key-moderator');
                scope.cntKey = makeKeyBox('key-counter');
                return utils.pAll([
                    scope.modKey.load(),
                    scope.cntKey.load()
                ]);
            }
        });
        ui.addState('mod-voting-info', {
            divs: ['mod-voting-info'],
            menu: modMenu,
            onEnter: function (scope) {
                scope.votingDescr = makeVotingInfoBox('voting-descr');
                scope.votingOptions = makeVotingInfoBox('voting-options');
                return utils.pAll([
                    scope.votingDescr.load(),
                    scope.votingOptions.load()
                ]);
            }
        });
        ui.addState('mod-voters', {
            divs: ['mod-voters'],
            menu: modMenu,
            onEnter: function (scope) {
                scope.newVoters = new ui.TextBox('new-voters', {
                    load: function () {
                        return mod.loadVoterList()
                            .then(function () {return '';});
                    },
                    save: mod.addVoters,
                    isDisabled: function () {
                        return false;
                    }
                });
                return scope.newVoters.load();
            }
        });
        ui.addState('mod-ballots', {
            divs: ['mod-ballots'],
            menu: modMenu,
            onEnter: function (scope) {
                scope.biSwitch = makeACLSwitch('ballot-issuance', 'ballots.acl');
                return scope.biSwitch.load();
            }
        });
    });

})(this.registry);
