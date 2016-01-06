/*
 * Keygen UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var crypto = registry.crypto;
    var ui = registry.ui;

    var keygen = registry.keygen = {};

    keygen.uiGenerate = function () {
        var password = crypto.genToken();
        $('#keygen-password').val(password);

        crypto.setKeySize(1024);
        crypto.initKeys(password);
        var htoken = crypto.hash(crypto.hash(password));
        $('#keygen-public-info').val('htoken: ' + htoken + '\n\n' +
            'public key:\n' + utils.wrapData(crypto.publicKey, 59));
    };

    $(document).ready(function () {
        $('#keygen-generate').click(keygen.uiGenerate);
        ui.addSwitchableState('keygen', {
            divs: ['keygen'],
            menu: [{name: 'Back to login form', state: 'auth-form'}]
        });
    });

})(this.registry);
