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

    /* Load voter list. */
    mod.loadVoterList = function () {
        var list = $('#mod-voter-list');

        return store.read('users')
            .then(function (data) {
                var userList = utils.parseUserList(data);
                var voterList = userList
                    .filter(function (u) {return u.role === 'voter';})
                    .sort(function (a, b) {return Number(a.id) - Number(b.id);});
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
    function createVoters(voters, firstId) {
        return voters.map(function (v) {
            var id = String(firstId++);
            var password = crypto.genToken();
            var htoken = crypto.hash(crypto.hash(password));
            return {
                id: id,
                password: password,
                userRec: [id, htoken, v.email, v.name, 'voter'].join(':')
            };
        });
    }

    /* Add voters to the voters list (create accounts). */
    mod.addVoters = function () {
        var input = $('#new-voters');
        var newVoters = utils.parseData(input.val(), ['name', 'email']);
        if (newVoters.length === 0) {
            return;
        }

        return store.read('users')
            .then(function (data) {
                var userList = utils.parseUserList(data);
                var maxId = Math.max.apply(null, userList.map(function (u) {
                    return Number(u.id);
                }));
                var created = createVoters(newVoters, maxId + 1);
                var records = created.map(function (v) {return v.userRec;});
                return store.write('users', data + '\n' + records.join('\n'));
            })
            .then(function () {
                input.val('');
            })
            .then(mod.loadVoterList, ui.reportError);
    };

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
            divs: ['mod-ballots'], menu: modMenu
        });
    });

})(this.registry);
