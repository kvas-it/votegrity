/*
 * Web service for the key-value store.
 */

'use strict';

function storeService(store) {

    return function processRequest(req, res) {

        function respond(response) {
            res.set({'Content-type': 'application/json'});
            res.json(response);
            res.end();
        }

        function sendData(data) {
            respond({status: 'ok', data: data});
        }

        function sendOk() {
            respond({status: 'ok'});
        }

        function sendErrorMessage(message) {
            respond({status: 'error', message: message});
        }

        function sendError(err) {
            sendErrorMessage(err.message);
        }

        if (req.method !== 'POST') {
            return res.status(405).end(); // Method not allowed.
        }

        var method = req.body.method;
        var at = req.body.accessToken;
        var key = req.body.key;
        var value = req.body.value;

        if (method !== 'read' && method !== 'write') {
            return sendErrorMessage('Invalid method');
        }

        if (!at) {
            return sendErrorMessage('Access denied');
        }

        if (!key) {
            return sendErrorMessage('No key provided');
        }

        if (method === 'write' && value === undefined) {
            return sendErrorMessage('No value provided');
        }

        if (method === 'read') {
            return store.read(key, at).then(sendData).catch(sendError);
        } else {
            return store.write(key, value, at).then(sendOk).catch(sendError);
        }
    };
}

module.exports = storeService;
