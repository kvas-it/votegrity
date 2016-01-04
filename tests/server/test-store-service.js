/*
 * Tests for key-value store service.
 */

'use strict';

require('should');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('supertest-as-promised');

var StoreMock = require('../utils/store-mock.js');
var storeService = require('../../server/store-service');

describe('Key-value store web service', function () {

    var store;
    var app;

    beforeEach(function () {
        store = new StoreMock({record: true, data: {a1: 'hello'}});
        app = express();
        app.use(bodyParser.json());
        app.use('/store', storeService(store));
    });

    function testRequest(req) {
        if (req.accessToken === undefined) {
            req.accessToken = 'token';
        }
        return request(app)
            .post('/store')
            .send(req)
            .then((result) => {
                if (result.status !== 200) {
                    throw Error(result.text);
                }
                result.type.should.eql('application/json');
                return result.res.body;
            });
    }

    it('should read', function () {
        return testRequest({method: 'read', key: 'a1'})
            .then((res) => {
                res.status.should.be.eql('ok');
                res.data.should.be.eql('hello');
                store.ops.should.be.eql(['r:a1:token']);
            });
    });

    it('should write', function () {
        return testRequest({method: 'write', key: 'b2', value: 'world'})
            .then((res) => {
                res.status.should.be.eql('ok');
                store.data.b2.should.be.eql('world');
                store.ops.should.be.eql(['w:b2:world:token']);
            });
    });

    it('should refuse to read without id', function () {
        return testRequest({method: 'read'})
            .then((res) => {
                res.status.should.be.eql('error');
                res.message.should.be.eql('No key provided');
            });
    });

    it('should refuse to write without id', function () {
        return testRequest({method: 'write', value: 'value'})
            .then((res) => {
                res.status.should.be.eql('error');
                res.message.should.be.eql('No key provided');
            });
    });

    it('should refuse to write without value', function () {
        return testRequest({method: 'write', key: 'b2'})
            .then((res) => {
                res.status.should.be.eql('error');
                res.message.should.be.eql('No value provided');
            });
    });

    it('should handle funny chars', function () {
        var data = '\u1234\u2345\u3456\u4567';
        return testRequest({method: 'write', key: 'b2', value: data})
            .then(() => testRequest({method: 'read', key: 'b2'}))
            .then((res) => {
                res.status.should.be.eql('ok');
                res.data.should.be.eql(data);
            });
    });

    it('should refuse get', function () {
        return request(app)
            .get('/store')
            .then((result) => {
                result.status.should.not.be.eql(200);
            });
    });

    it('should reject invalid methods', function () {
        return testRequest({method: 'invalid'})
            .then((res) => {
                res.status.should.be.eql('error');
                res.message.should.be.eql('Invalid method');
            });
    });

    it('should propagate errors', function () {
        return testRequest({method: 'read', key: 'missing'})
            .then((res) => {
                res.status.should.be.eql('error');
                res.message.should.be.eql('Missing key: missing');
            });
    });

    it('should refuse access for empty AT', function () {
        return testRequest({method: 'read', accessToken: '', key: 'a1'})
            .then((res) => {
                res.status.should.be.eql('error');
                res.message.should.be.eql('Access denied');
            });
    });
});
