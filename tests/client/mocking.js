/*
 * Mocking support for client-side testing.
 */

(function (registry) {

    'use strict';

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
})(this.registry);
