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

        if (method === 'read') {
            return store.read(req.body.key)
                .then(sendData)
                .catch(sendError);
        } else if (method === 'write') {
            if (!('value' in req.body)) {
                return sendErrorMessage('No value provided');
            }
            return store.write(req.body.key, req.body.value)
                .then(sendOk)
                .catch(sendError);
        } else {
            return sendErrorMessage('Invalid method');
        }
    };
}

module.exports = storeService;
