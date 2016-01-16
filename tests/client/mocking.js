/*
 * Mocking support for client-side testing.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var store = registry.store;

    var mocking = registry.mocking = {};

    mocking.originals = {};

    function traverse(obj, path) {
        if (path === 'console.log') {
            return {obj: console, key: 'log'};
        }
        path = path.split('.');
        while (path.length > 1) {
            obj = obj[path.shift()];
        }
        return {obj: obj, key: path[0]};
    }

    function getPath(obj, path) {
        if (path === 'url') {
            return window.location.href;
        }
        var t = traverse(obj, path);
        return t.obj[t.key];
    }

    function setPath(obj, path, value) {
        if (path === 'url') {
            window.history.replaceState('', '', value);
        }
        var t = traverse(obj, path);
        t.obj[t.key] = value;
    }

    mocking.mock = function (path, value) {
        if (value === undefined) {
            value = function () {};
        }
        if (!(path in mocking.originals)) {
            mocking.originals[path] = getPath(registry, path);
        }
        setPath(registry, path, value);
    };

    mocking.unmock = function (path) {
        setPath(registry, path, mocking.originals[path]);
        delete mocking.originals[path];
    };

    mocking.unmockAll = function () {
        for (var path in mocking.originals) {
            mocking.unmock(path);
        }
    };

    /* Mock key-value store client with a simple implementation
     * on top of a map. */
    mocking.mockStore = function (storeData) {

        storeData = storeData || {};

        mocking.mock('store.read', function (key) {
            if (key in storeData) {
                return utils.pResolve(storeData[key]);
            } else {
                return utils.pReject(Error('Missing key: ' + key));
            }
        });

        mocking.mock('store.write', function (key, data) {
            storeData[key] = data;
            return utils.pResolve(true);
        });

        /* Update one key and return a promise to update of observable. */
        function set(key, value) {
            storeData[key] = value;
            return store.getKeyModel(key).load();
        }

        /* Update many keys and return a promise. */
        function setMany(config) {
            var loadPs = [];
            for (var key in config) {
                loadPs.push(set(key, config[key]));
            }
            return utils.pAll(loadPs);
        }

        store.setAccessToken('dummy'); // Reset store cache.

        return {
            set: set,
            setMany: setMany,
            get: function (key) {return storeData[key];}
        };
    };

    /* Replace real crypto with a fake version for testing. */
    mocking.mockCrypto = function () {
        mocking.mock('crypto.sign', function (text) {
            return text + '\nsigned';
        });
        mocking.mock('crypto.signed2plain', function (text) {
            return text.substring(0, text.length - 7);
        });
        mocking.mock('crypto.initKeys', function () {
            mocking.mock('crypto.publicKey', 'publicKey');
            mocking.mock('crypto.keyPair', 'keyPair');
        });
    };

})(this.registry);
