/*
 * Client for the votegrity server-side key-value store.
 */

(function (registry) {

    'use strict';

    var store = registry.store = {};

    store.accessToken = undefined;
    store.baseUrl = '';

    function apiCall(params) {

        params.accessToken = store.accessToken;
        var deferred = ayepromise.defer();

        function ajaxSuccess(data, status) {
            if (status === 'success') {
                if (data.status === 'ok') {
                    deferred.resolve(data.data);
                } else {
                    deferred.reject(Error(data.message));
                }
            } else {
                deferred.reject(Error(status));
            }
        }

        function ajaxError(xhr, status, error) {
            if (!error) {
                error = 'Request failed';
            }
            deferred.reject(Error(error));
        }

        if (!store.accessToken) {
            // No need to go to server, it will fail.
            deferred.reject(Error('Access denied'));
        }

        $.ajax({
            type:'POST',
            url: store.baseUrl + '/api/store',
            contentType: 'application/json',
            data: JSON.stringify(params),
            success: ajaxSuccess,
            error: ajaxError
        });

        return deferred.promise;
    }

    store.read = function (key, default_) {
        return apiCall({method: 'read', key: key})
            .fail(function (err) {
                if (err.message === 'Missing key: ' + key &&
                        default_ !== undefined) {
                    return default_;
                } else {
                    throw err;
                }
            });
    };

    store.write = function (key, value) {
        return apiCall({method: 'write', key: key, value: value})
            .then(function () {return true;});
    };

    /* KO model of store key. */
    store.Key = function (key) {

        var self = {
            value: ko.observable(),
            loadedValue: ko.observable(),
            loading: ko.observable(false),
            saving: ko.observable(false),
            error: ko.observable(null)
        };

        self.load = function () {
            self.loading(true);
            self._promise = store.read(key, '')
                .then(function (value) {
                    self.value(value);
                    self.loadedValue(value);
                    self.loading(false);
                    self.error(null);
                })
                .fail(function (err) {
                    self.loading(false);
                    self.error(err.message);
                });
            return self._promise;
        };

        self.save = function () {
            self.saving(true);
            self._promise = store.write(key, self.value())
                .then(function () {
                    self.saving(false);
                    return self.load();
                })
                .fail(function (err) {
                    self.saving(false);
                    self.error(err.message);
                });
            return self._promise;
        };

        self.modified = ko.pureComputed(function () {
            return self.value() !== self.loadedValue();
        });

        self.status = ko.pureComputed(function () {
            if (self.saving()) {
                return 'saving...';
            } else if (self.loading()) {
                return 'loading...';
            } else if (self.error() === 'Request failed') {
                return 'disconnected';
            } else if (self.error() === 'Access denied') {
                return 'no access';
            } else if (self.modified()) {
                return 'modified';
            } else if (self.value() === undefined) {
                return 'missing';
            } else {
                return '';
            }
        });

        self.load();
        return self;
    };

    /* Loaded keys as an observable array. */
    store.all = ko.observable({});

    /* Add key to the loaded keys. */
    store.loadKey = function (key) {
        var all = store.all();
        if (!(key in all)) {
            all[key] = store.Key(key);
            store.all(all);
        }
    };

    /* Get key value.
     *
     * This will return synchronously, but if the key is not already loaded
     * it will return ``undefined`` and initiate the loading.
     *
     * This method is intended for computed observables -- they will be updated
     * when the value is loaded.
     */
    store.getKeyValue = function (key) {
        store.loadKey(key);
        return store.all()[key].value();
    };

    store.setAccessToken = function (token) {
        store.accessToken = token;
        store.all({});
    };

    store.setBaseUrl = function (url) {
        store.baseUrl = url;
        store.all({});
    };

})(this.registry);
