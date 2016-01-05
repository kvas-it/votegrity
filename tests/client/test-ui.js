/*
 * Tests for ui.
 */

describe('UI', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var ui = window.registry.ui;

    it('should switch states', function () {
        ui.switchToState('auth-form');
        $('#auth-form').css('display').should.be.eql('block');
        $('#loading').css('display').should.be.eql('none');
    });

    it('should report errors', function () {
        ui.hideError();
        $('#error').css('display').should.be.eql('none');
        mocking.mock('console.log');
        ui.reportError(Error('abc'));
        mocking.unmock('console.log');
        $('#error').css('display').should.be.eql('block');
        $('#error-message').html().should.be.eql('abc');
    });
});
