/*
 * Counter UI.
 */

(function (registry) {

    'use strict';

    var ui = registry.ui;

    $(document).ready(function () {
        var cntMenu = [
            {name: 'Vote configuration', state: 'cnt-voting'},
            {name: 'Ballots issuance', state: 'cnt-ballots'},
            {name: 'Counting and publishing results', state: 'cnt-count'}
        ];
        ui.addState('cnt-main', {
            divs: ['cnt-main'],
            menu: cntMenu
        });
        ui.addState('cnt-voting', {
            divs: ['cnt-voting'],
            menu: cntMenu
        });
        ui.addState('cnt-ballots', {
            divs: ['cnt-ballots'],
            menu: cntMenu
        });
        ui.addState('cnt-count', {
            divs: ['cnt-count'],
            menu: cntMenu
        });
    });

})(this.registry);
