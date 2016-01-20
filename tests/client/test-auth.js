/*
 * Tests for auth module.
 */

describe('Auth', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;
    var auth = window.registry.auth;

    var users =
        '1:gapniYowXNxmiYIcrGskCXSemafooW:alice@mod.org:Alice Mod:moderator\n' +
        '2:AXs8OX2aohnlEdTJoJxoEI6f58BowY:bob@cnt.org:Bob Cnt:counter\n' +
        '3:Z8wnYOtVq8r1WBPLY6WKmBKcSdw5bS:carol@vot.org:Carol Vot:voter';

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
