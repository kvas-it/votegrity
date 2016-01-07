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

    it('should parse user list', function () {
        var userList = '# user list\n\n1:a:b:c:d\n2:e:f:g:h';
        utils.parseUsersData(userList).should.be.eql([
            {id: '1', htoken: 'a', email: 'b', name: 'c', role: 'd'},
            {id: '2', htoken: 'e', email: 'f', name: 'g', role: 'h'}
        ]);
    });
});

