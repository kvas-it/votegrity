/*
 * Client for the votegrity server-side key-value store.
 */

(function (registry) {

    'use strict';

    var store = registry.store = {};

    store.accessToken = '';
    store.baseUrl = '';

    store.setAccessToken = function (token) {
        store.accessToken = token;
    };

    store.setBaseUrl = function (url) {
        store.baseUrl = url;
    };

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
})(this.registry);
