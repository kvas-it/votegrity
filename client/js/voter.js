/*
 * Voter UI.
 */

(function (registry) {

    'use strict';

    var ui = registry.ui;

    $(document).ready(function () {
        ui.addSwitchableState('vot-main', {divs: ['vot-main']});
    });

})(this.registry);
