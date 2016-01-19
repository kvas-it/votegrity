/*
 * Test that the framework works.
 */

describe('Utils', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;

    after(mocking.unmockAll);

    it('should extract password from url', function () {
        mocking.mock('url', 'http://a/b?x=y&auth=abc&a=b');
        var got = utils.extractPasswordFromUrl();
        got.should.be.eql('abc');
        window.location.href.should.be.eql('http://a/b');
    });

    it('should parse data', function () {
        var userList = '# user list\n\n1:a:b:c:d\n2:e:f:g:h';
        var fields = ['id', 'htoken', 'email', 'name', 'role'];
        var expect = [
            {id: '1', htoken: 'a', email: 'b', name: 'c', role: 'd'},
            {id: '2', htoken: 'e', email: 'f', name: 'g', role: 'h'}
        ];

        utils.parseUserList(userList).should.be.eql(expect);
        utils.parseData(userList, fields).should.be.eql(expect);
    });

    it('should join promises', function () {
        return utils.pJoin(utils.pResolve(1), 2, utils.pResolve(3),
            function (a, b, c) {
                return a + b + c;
            })
            .then(function (total) {
                total.should.be.eql(6);
            });
    });

    it('should wait for multiple promises', function () {
        return utils.pAll([0, utils.pResolve(1), 2, utils.pResolve(3), 4])
            .then(function (results) {
                results.should.be.eql([0, 1, 2, 3, 4]);
            });
    });

    it('should wait for zero promises', function () {
        return utils.pAll([]).then(function (results) {
            results.should.be.eql([]);
        });
    });

    it('should do koAttr', function () {
        var a = ko.observable();
        var b = utils.koAttr(a, 'a', 1);
        b().should.be.eql(1);
        a({a: 2});
        b().should.be.eql(2);
        a({b: 1});
        b().should.be.eql(1);
    });

    it('should do koLength', function () {
        var a = ko.observable();
        var aLen = utils.koLength(a);
        aLen().should.be.eql(0);
        a('abc');
        aLen().should.be.eql(3);
        a([1, 2]);
        aLen().should.be.eql(2);
    });
});

