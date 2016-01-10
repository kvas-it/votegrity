/*
 * Tests for auth module.
 */

describe('Auth', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;
    var auth = window.registry.auth;

    var users =
        '1:TUrDi0FcAiT2i2KmNx/z5tqR3+w6n9:alice@mod.org:Alice Mod:moderator\n' +
        '2:+T/xCTkR/ysE6GRfQaf4LOV38yfvCZ:bob@cnt.org:Bob Cnt:counter\n' +
        '3:U/i4hqAWk4EIKL3CBIXlxK7Xgimepq:carol@vot.org:Carol Vot:voter';

    beforeEach(function () {
        mocking.mock('store.read', function () {
            return utils.pResolve(users);
        });
    });

    afterEach(function () {
        auth.logOut();
        mocking.unmockAll();
    });

    it('should log in', function () {
        return auth.authenticate('123').then(function () {
            auth.user().name.should.be.eql('Alice Mod');
        });
    });

    it('should log in with password from url', function () {
        mocking.mock('url', 'http://a/b?&auth=456');
        return auth.init().then(function () {
            auth.user().name.should.be.eql('Bob Cnt');
        });
    });
});
