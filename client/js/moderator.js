/*
 * Moderator UI.
 */

(function (registry) {

    'use strict';

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
                    target.attr('readonly', true);
                },
                function fail(err) {
                    if (err.message === 'Missing key: ' + key) {
                        status.html(' (missing)');
                        button.show();
                        button.click(function () {
                            savePK(key, targetId);
                        });
                    } else {
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
        return store.write(key, target.val()).then(function () {
            status.html('');
            target.attr('readonly', true);
        },
        function fail(err) {
            ui.reportError(err);
            button.show();
            status.html(' (save failed)');
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
            divs: ['mod-voters'], menu: modMenu
        });
        ui.addSwitchableState('mod-ballots', {
            divs: ['mod-ballots'], menu: modMenu
        });
    });

})(this.registry);
