/*
 * Keygen UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var crypto = registry.crypto;

    var keygen = registry.keygen = {};

    keygen.View = function () {

        var self = {
            password: ko.observable(''),
            publicKey: ko.observable('')
        };

        self.htoken = ko.pureComputed(function () {
            return crypto.hash(crypto.hash(self.password()));
        });

        self.publicInfo = ko.pureComputed(function () {
            var htoken = self.htoken();
            var publicKey = self.publicKey();
            if (htoken && publicKey) {
                return 'htoken: ' + htoken + '\n\n' +
                    'public key:\n' + utils.wrapData(publicKey, 59);
            } else {
                return '';
            }
        });

        self.generate = function () {
            self.password(crypto.genToken());
            crypto.setKeySize(1024);
            crypto.initKeys(self.password());
            self.publicKey(crypto.publicKey);
        };

        return self;
    };

})(this.registry);
