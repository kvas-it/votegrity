/*
 * Tests for ui.
 */

describe('UI', function () {

    'use strict';

    var ui = window.registry.ui;

    it('should switch states', function () {
        ui.switchToState('auth-form');
        $('#auth-form').css('display').should.be.eql('block');
        $('#loading').css('display').should.be.eql('none');
    });
});

