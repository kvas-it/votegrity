/*
 * Tests for ui.
 */

describe('UI', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var ui = window.registry.ui;

    it('should switch states', function () {
        ui.setState('auth-form').then(function (res) {
            res.should.eql(true);
            $('#auth-form').css('display').should.be.eql('block');
            $('#loading').css('display').should.be.eql('none');
        });
    });

    it('should not switch to missing states', function () {
        ui.setState('missing').then(function (res) {
            res.should.eql(false);
        });
    });

    it('should save state controller', function () {
        ui.addState('withCtl', {
            divs: [],
            onEnter: function (scope) {
                scope.a = 1;
            }
        });
        ui.setState('withCtl').then(function (res) {
            res.should.eql(true);
            ui.currentStateScope.a.should.be.eql(1);
        });
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

describe('UI switch', function () {

    'use strict';

    var utils = window.registry.utils;
    var ui = window.registry.ui;

    var swtch;
    var state;

    beforeEach(function () {
        $('#stuff').html('<div id="enable-thing">Thing is: enabled</div>');
        swtch = new ui.Switch('enable-thing', {
            load: function () {
                return utils.pResolve(state);
            },
            enable: function () {
                state = true;
                return utils.pResolve(true);
            },
            disable: function () {
                state = false;
                return utils.pResolve(false);
            }
        });
    });

    function shouldBeEnabled() {
        var html = $('#enable-thing').html();
        html.should.containEql('Thing is: enabled');
        html.should.containEql('<button id="enable-thing-disable">disable</button>');
    }

    function shouldBeDisabled() {
        var html = $('#enable-thing').html();
        html.should.containEql('Thing is: disabled');
        html.should.containEql('<button id="enable-thing-enable">enable</button>');
    }

    it('should load enabled state and disable', function () {
        state = true;
        return swtch.load().then(function () {
            shouldBeEnabled();
            $('#enable-thing-disable').click();
            return utils.pDelay(1);
        }).then(shouldBeDisabled);
    });

    it('should load disabled state and enable', function () {
        state = false;
        return swtch.load().then(function () {
            shouldBeDisabled();
            $('#enable-thing-enable').click();
            return utils.pDelay(1);
        }).then(shouldBeEnabled);
    });
});
