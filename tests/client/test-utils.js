/*
 * Test that the framework works.
 */

describe('Utils', function () {

    'use strict';

    var utils = window.registry.utils;

    function setUrl(url) {
        window.history.replaceState('', '', url);
    }

    var savedUrl = window.location.href;

    after(function () {
        setUrl(savedUrl);
    });

    it('should extract access token from url', function () {
        setUrl('http://a/b?x=y&auth=abc&a=b');
        var got = utils.extractAccessTokenFromUrl();
        got.should.be.eql('abc');
        window.location.href.should.be.eql('http://a/b');
    });
});

