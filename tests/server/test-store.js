/*
 * Tests for key-value store.
 */

'use strict';

require('should');
var fs = require('fs');
var P = require('bluebird');
var temp = require('promised-temp').track();

var readFile = P.promisify(fs.readFile);
var writeFile = P.promisify(fs.writeFile);
var fail = () => {throw Error('Test failed');};

var Store = require('../../server/store');

describe('Key-value store ', function () {

    var tmpDir;
    var store;

    beforeEach(function () {
        return temp.mkdir('').then(function (td) {
            tmpDir = td;
            store = new Store(td);
        });
    });

    it('should create data directory if not exists', function () {
        var dir = tmpDir + '/other';
        store = new Store(dir);
        var stats = fs.statSync(dir);
        stats.isDirectory().should.be.eql(true);
    });

    it('should fail if directory is a file', function () {
        var dir = tmpDir + '/other';
        fs.writeFileSync(dir, '');
        try {
            new Store(dir);
            fail();
        } catch (err) {
            err.message.should.endWith('is not a directory');
        }
    });

    it('should save values to files', function () {
        return store.write('key', 'value').then((ok) => {
            ok.should.be.ok;
            return readFile(tmpDir + '/key', 'utf8');
        }).then((got) => got.should.be.eql('value'));
    });

    it('should load files from files', function () {
        return writeFile(tmpDir + '/key', 'value')
            .then(() =>  store.read('key'))
            .then((got) => got.should.be.eql('value'));
    });

    it('should reject bad keys', function () {
        return store.write('.dot', '')
            .then(fail)
            .catch((err) => err.message.should.startWith('Invalid key'));
    });

    it('should reject keys with spaces', function () {
        return store.write('with space', '')
            .then(fail)
            .catch((err) => err.message.should.startWith('Invalid key'));
    });

    it('should reject wrong chars in keys', function () {
        return store.write('a/b', '')
            .then(fail)
            .catch((err) => err.message.should.startWith('Invalid key'));
    });

    it('should detect missing keys', function () {
        return store.read('missing')
            .then(fail)
            .catch((err) => err.message.should.startWith('Missing key'));
    });

    it('should work well with funny characters', function () {
        var data = '\u1234\u2345\u3456\u4567';
        return store.write('key', data)
            .then(() => store.read('key'))
            .then((got) => got.should.be.eql(data));
    });

    it('should provide key timestamps', function () {
        var stat = P.promisify(fs.stat);
        return store.write('key', 'value')
            .then(() => store.getTimeStamp('key'))
            .then((ts) =>
                stat(tmpDir + '/key').then((stats) =>
                    ts.getTime().should.be.eql(stats.mtime.getTime())));
    });
});
