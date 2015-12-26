/*
 * Tests for key-value store service.
 */

'use strict';

require('should');
var _ = require('lodash');
var P = require('bluebird');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('supertest-as-promised');

var storeService = require('../server/store-service');

function TestStore() {
    _.bindAll(this);
    this.data = {};
}

TestStore.prototype.write = P.method(function (key, value) {
    this.data[key] = value;
});

TestStore.prototype.read = P.method(function (key) {
    if (key in this.data) {
        return this.data[key];
    } else {
        throw Error('Missing key: ' + key);
    }
});

describe('Key-value store web service', function () {

    var store;
    var app;

    beforeEach(function () {
        store = new TestStore();
        store.write('a1', 'hello');
        app = express();
        app.use(bodyParser.json());
        app.use('/store', storeService(store));
    });

    function testRequest(req) {
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
            });
    });

    it('should write', function () {
        return testRequest({method: 'write', key: 'b2', value: 'world'})
            .then((res) => {
                res.status.should.be.eql('ok');
                store.data.b2.should.be.eql('world');
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
});
