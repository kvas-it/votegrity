/*
 * General utils.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils = {};

    /* Make a promise that resolves to result. */
    utils.pResolve = function (result) {
        var d = ayepromise.defer();
        d.resolve(result);
        return d.promise;
    };

    /* Make a promise that is rejected with the error. */
    utils.pReject = function (error) {
        var d = ayepromise.defer();
        d.reject(error);
        return d.promise;
    };

    /* Make a promise that resolves in ``delay`` milliseconds. */
    utils.pDelay = function (delay) {
        var d = ayepromise.defer();
        setTimeout(d.resolve, delay);
        return d.promise;
    };

    /* Wait for multiple promises and return array of results. */
    utils.pAll = function (promises) {
        if (promises.length === 0) {
            return utils.pResolve([]);
        } else {
            var last = promises.pop();
            return utils.pAll(promises).then(function (results) {
                if (typeof(last.then) !== 'function') {
                    last = utils.pResolve(last);
                }
                return last.then(function (lastResult) {
                    results.push(lastResult);
                    return results;
                });
            });
        }
    };

    /* Join promises. */
    utils.pJoin = function () {
        var args = Array.apply(null, arguments);
        var func = args.pop();
        return utils.pAll(args).then(function (results) {
            return func.apply(this, results);
        });
    };

    /* Extract password from URL and remove it from location. */
    utils.extractPasswordFromUrl = function () {
        var url = window.location.href;
        var parts = url.split('?');
        var base = parts[0];
        var qs = parts[1];
        if (!qs) {return;}
        var fields = qs.split('&');
        var token;
        fields.forEach(function (f) {
            var t = f.split('=');
            var name = t[0];
            var value = t[1];
            if (name === 'auth') {
                token = value;
            }
        });
        try {
            var title = $('title').text();
            window.history.replaceState(title, title, base);
        } catch (err) {
            console.log('Old browser :(');
        }
        return token;
    };

    /* Parse multiline colon-separated data. */
    utils.parseData = function (data, fields) {
        var lines = data.split('\n')
            .filter(function (l) {return l && l[0] !== '#';});
        return lines.map(function (line) {
            var ret = {};
            var values = line.split(':');
            fields.forEach(function (field, index) {
                ret[field] = values[index];
            });
            return ret;
        });
    };

    /* Parse user list (). */
    utils.parseUserList = function (data) {
        return utils.parseData(data, ['id', 'htoken', 'email', 'name', 'role']);
    };

    /* Split data (like a public key) into multiple short lines. */
    utils.wrapData = function (data, maxlen) {
        var lines = [];
        while (data.length > maxlen) {
            lines.push(data.substr(0, maxlen));
            data = data.substr(maxlen);
        }
        lines.push(data);
        return lines.join('\n');
    };

})(this.registry);
