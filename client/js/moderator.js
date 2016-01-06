/*
 * Moderator UI.
 */

(function (registry) {

    'use strict';

    var ui = registry.ui;

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
            divs: ['mod-keys'], menu: modMenu
        });
        ui.addSwitchableState('mod-voters', {
            divs: ['mod-voters'], menu: modMenu
        });
        ui.addSwitchableState('mod-ballots', {
            divs: ['mod-ballots'], menu: modMenu
        });
    });

})(this.registry);
