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

    /* Load private key into the textarea. */
    function loadPK(key, targetId) {
        var status = $('#' + targetId + '-status');
        var button = $('#' + targetId + '-save');
        var target = $('#' + targetId);

        status.html(' (loading...)');
        return store.read(key)
            .then(function (data) {
                status.html('');
                target.val(data);
                target.attr('disabled', true);
            },
            function fail(err) {
                if (err.message === 'Missing key: ' + key) {
                    status.html(' (missing)');
                    target.val('');
                    target.attr('disabled', false);
                    button.show();
                    button.click(function () {
                        savePK(key, targetId);
                    });
                } else {
                    status.html(' (loading failed)');
                    ui.reportError(err);
                }
            });
    }

    /* Save private key from the textarea. */
    function savePK(key, targetId) {
        var status = $('#' + targetId + '-status');
        var button = $('#' + targetId + '-save');
        var target = $('#' + targetId);

        if (target.val().length < 100) {
            return; // Can't be a legitimate key.
        }

        status.html(' (saving...)');
        button.hide();
        return store.write(key, target.val())
            .then(function () {
                status.html('');
                target.attr('disabled', true);
            },
            function fail(err) {
                ui.reportError(err);
                button.show();
                status.html(' (save failed)');
            })
            .then(function () {
                return store.write(key + '.acl', 'counter:read\nvoter:read');
            })
            .fail(function (err) {
                ui.reportError(err);
            });
    }

    /* Load moderator and counter keys from the server. */
    mod.loadPKs = function () {
        var modP = loadPK('key-moderator', 'key-moderator');
        var cntP = loadPK('key-counter', 'key-counter');
        return modP.then(function () {
            return cntP;
        });
    };

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
            },
            ui.reportError);
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
                if (userList.filter(function (u) {
                        return u.email === v.email;
                    }).length !== 0) {
                    throw Error('Duplicate email: ' + v.email);
                }
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
    mod.addVoters = function () {
        var input = $('#new-voters');

        return utils.pJoin(
            store.read('users'),
            store.read('init-passwords')
                .fail(function () {return '';}),
            function (usersData, initPWData) {
                var created = createVoters(input.val(), usersData);
                var records = created.map(function (v) {return v.userRec;});
                var pws = created.map(function (v) {return v.pwRec;});
                return utils.pAll([
                    store.write('users', usersData + '\n' + records.join('\n')),
                    store.write('init-passwords', initPWData + '\n' + pws.join('\n'))
                ]);
            })
            .then(function () {
                input.val('');
            })
            .then(mod.loadVoterList, ui.reportError);
    };

    /* Make permission switch that enables counter to edit a file. */
    function makeCounterACLSwitch(id, key) {
        return new ui.Switch(id, {
            load: function () {
                return store.read(key, '')
                    .then(function (acl) {
                        return acl.indexOf('counter:write') !== -1;
                    });
            },
            enable: function () {
                return store.write(key, 'counter:write');
            },
            disable: function () {
                return store.write(key, '');
            }
        });
    }

    $(document).ready(function () {
        var modMenu = [
            {name: 'Key management', state: 'mod-keys'},
            {name: 'Voter list', state: 'mod-voters'},
            {name: 'Ballot management', state: 'mod-ballots'}
        ];
        ui.addSwitchableState('mod-main', {
            divs: ['mod-main'], menu: modMenu
        });
        ui.addSwitchableState('mod-keys', {
            divs: ['mod-keys'],
            menu: modMenu,
            onEnter: mod.loadPKs
        });
        ui.addSwitchableState('mod-voters', {
            divs: ['mod-voters'],
            menu: modMenu,
            onEnter: function () {
                $('#add-voters').click(mod.addVoters);
                return mod.loadVoterList();
            }
        });
        ui.addSwitchableState('mod-ballots', {
            divs: ['mod-ballots'],
            menu: modMenu,
            onEnter: function (scope) {
                scope.votingDescrSwitch = makeCounterACLSwitch(
                    'voting-descr-edit', 'voting-descr.acl');
                scope.ballotIssuanceSwitch = makeCounterACLSwitch(
                    'ballot-issuance', 'ballots.acl');
                return ui.pAll([
                    scope.votingDescrSwitch.load(),
                    scope.ballotIssuanceSwitch.load()
                ]);
            }
        });
    });

})(this.registry);
