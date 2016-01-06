/*
 * Tests for auth module.
 */

describe('Auth module', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var auth = window.registry.auth;
    var ui = window.registry.ui;

    beforeEach(function () {
        mocking.mock('store.read', function () {
            var d = ayepromise.defer();
            d.resolve('TUrDi0FcAiT2i2KmNx/z5tqR3+w6n9:a@b.c:A:moderator');
            return d.promise;
        });
    });

    afterEach(mocking.unmockAll);

    it('should log in with password from url', function () {
        mocking.mock('url', 'http://a/b?&auth=123');
        return auth.init().then(function () {
            ui.currentState.should.be.eql('main');
        });
    });

    it('should log in with good password', function () {
        return auth.uiAuthenticate('123').then(function () {
            ui.currentState.should.be.eql('main');
            $('#user-info').html().should.be.eql('Logged in as A (moderator)');
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
