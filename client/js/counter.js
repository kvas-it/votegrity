/*
 * Counter UI.
 */

(function (registry) {

    'use strict';

    var ui = registry.ui;

    $(document).ready(function () {
        ui.addSwitchableState('cnt-main', {divs: ['cnt-main']});
    });

})(this.registry);
