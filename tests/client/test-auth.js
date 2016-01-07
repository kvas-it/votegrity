/*
 * Tests for auth module.
 */

describe('Auth', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;
    var auth = window.registry.auth;
    var ui = window.registry.ui;

    var users =
        '1:TUrDi0FcAiT2i2KmNx/z5tqR3+w6n9:alice@mod.org:Alice Mod:moderator\n' +
        '2:+T/xCTkR/ysE6GRfQaf4LOV38yfvCZ:bob@cnt.org:Bob Cnt:counter\n' +
        '3:U/i4hqAWk4EIKL3CBIXlxK7Xgimepq:carol@vot.org:Carol Vot:voter';

    beforeEach(function () {
        mocking.mock('store.read', function () {
            return utils.pResolve(users);
        });
    });

    afterEach(mocking.unmockAll);

    it('should log in with password from url', function () {
        auth.user = null;
        mocking.mock('url', 'http://a/b?&auth=123');
        return auth.init().then(function () {
            auth.user.should.be.ok;
        });
    });

    it('should log in as moderator', function () {
        return auth.uiAuthenticate('123').then(function () {
            ui.currentState.should.be.eql('mod-main');
            $('#user-info').html().should.be.eql('Logged in as Alice Mod (moderator)');
            $('#logout-button').css('display').should.be.eql('inline-block');
        });
    });

    it('should log in as counter', function () {
        return auth.uiAuthenticate('456').then(function () {
            ui.currentState.should.be.eql('cnt-main');
            $('#user-info').html().should.be.eql('Logged in as Bob Cnt (counter)');
            $('#logout-button').css('display').should.be.eql('inline-block');
        });
    });

    it('should log in as voter', function () {
        return auth.uiAuthenticate('789').then(function () {
            ui.currentState.should.be.eql('vot-main');
            $('#user-info').html().should.be.eql('Logged in as Carol Vot (voter)');
            $('#logout-button').css('display').should.be.eql('inline-block');
        });
    });

    it('should not log in with bad password', function () {
        mocking.mock('console.log');
        return auth.uiAuthenticate('321').then(function () {
            mocking.unmock('console.log');
            ui.currentState.should.be.eql('auth-form');
            $('#user-info').html().should.be.eql('Anonymous');
            $('#logout-button').css('display').should.be.eql('none');
        });
    });
});
