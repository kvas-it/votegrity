/*
 * Client for the votegrity server-side key-value store.
 */

(function (global) {

    'use strict';

    var registry = global.registry || {};
    global.registry = registry;

    var accessToken;
    var baseUrl = '';

    var store = registry.store = {};

    store.setAccessToken = function (token) {
        accessToken = token;
    };

    store.setBaseUrl = function (url) {
        baseUrl = url;
    };

    function apiCall(params) {

        params.accessToken = accessToken;
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
            deferred.reject(Error(error));
        }

        $.ajax({
            type:'POST',
            url: baseUrl + '/api/store',
            contentType: 'application/json',
            data: JSON.stringify(params),
            success: ajaxSuccess,
            error: ajaxError
        });

        return deferred.promise;
    }

    store.read = function (key) {
        return apiCall({method: 'read', key: key});
    };

    store.write = function (key, value) {
        return apiCall({method: 'write', key: key, value: value})
            .then(function () {return true;});
    };
})(this);
