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
        var userList = '# user list\n\na:b:c:d\ne:f:g:h';
        utils.parseUsersData(userList).should.be.eql([
            {htoken: 'a', email: 'b', name: 'c', role: 'd'},
            {htoken: 'e', email: 'f', name: 'g', role: 'h'}
        ]);
    });
});

