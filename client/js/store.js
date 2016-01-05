/*
 * Client for the votegrity server-side key-value store.
 */

(function () {
    'use strict';

    var accessToken;
    var baseUrl = '';

    function setAccessToken(token) {
        accessToken = token;
    }

    function setBaseUrl(url) {
        baseUrl = url;
    }

    function apiCall(params) {
        params.accessToken = accessToken;
        var deferred = ayepromise.defer();
        $.ajax({
            type:'POST',
            url: baseUrl + '/api/store',
            contentType: 'application/json',
            data: JSON.stringify(params),
            success: function (data, status) {
                if (status === 'success') {
                    if (data.status === 'ok') {
                        deferred.resolve(data.data);
                    } else {
                        deferred.reject(Error(data.message));
                    }
                } else {
                    deferred.reject(Error(status));
                }
            },
            error: function (xhr, status, error) {
                deferred.reject(Error(error));
            }
        });
        return deferred.promise;
    }

    function read(key) {
        return apiCall({method: 'read', key: key});
    }

    function write(key, value) {
        return apiCall({method: 'write', key: key, value: value})
            .then(function () {return true;});
    }

    window.votegrityStore = {
        setAccessToken: setAccessToken,
        setBaseUrl: setBaseUrl,
        read: read,
        write: write
    };
})();
