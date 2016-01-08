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

describe('UI text box', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;
    var ui = window.registry.ui;

    var tbox;
    var content;
    var contentP;
    var saveP;
    var disabledP;

    var statusE;
    var saveE;
    var textareaE;

    afterEach(mocking.unmockAll);

    beforeEach(function () {

        $('#stuff').html(
            '<div id="tbox">' +
            '  <span id="tbox-status">xxx</span>' +
            '  <button id="tbox-save">save</button>' +
            '  <textarea id="tbox-content"></textarea>' +
            '</div>');

        content = '42';
        contentP = utils.pResolve('42');
        saveP = utils.pResolve(true);
        disabledP = utils.pResolve(false);

        statusE = $('#tbox-status');
        saveE = $('#tbox-save');
        textareaE = $('#tbox-content');

        tbox = new ui.TextBox('tbox', {
            load: function () {
                return contentP;
            },
            save: function (c) {
                content = c;
                return saveP;
            },
            isDisabled: function (content) {
                content.should.be.eql($('#tbox-content').val());
                return disabledP;
            }
        });
    });

    function ensureDisabled(flag) {
        (textareaE.attr('disabled') ? true : false).should.be.eql(flag);
        (saveE.css('display') === 'none').should.be.eql(flag);
    }

    it('should load the box', function () {
        return tbox.load().then(function () {
            ensureDisabled(false);
            textareaE.val().should.be.eql('42');
            statusE.html().should.be.eql('');
        });
    });

    it('should disable the box', function () {
        disabledP = utils.pResolve(true);
        return tbox.load().then(function () {
            statusE.html().should.be.eql('(read only)');
            ensureDisabled(true);
        });
    });

    it('should save the box content', function () {
        textareaE.val('55');
        return tbox.save().then(function () {
            ensureDisabled(false);
            textareaE.val().should.be.eql('42');
            content.should.be.eql('55');
            statusE.html().should.be.eql('');
        });
    });

    it('should disable the box after save', function () {
        disabledP = utils.pResolve(true);
        return tbox.save().then(function () {
            statusE.html().should.be.eql('(read only)');
            ensureDisabled(true);
        });
    });

    it('should react to the save button presses', function () {
        textareaE.val('55');
        saveE.click();
        return utils.pDelay(1).then(function () {
            content.should.be.eql('55');
        });
    });

    it('should understand and indicate empty content', function () {
        textareaE.val('55');
        contentP = utils.pResolve(undefined);
        return tbox.load().then(function () {
            statusE.html().should.be.eql('(missing)');
            textareaE.val().should.be.eql('');
        });
    });

    it('should report status', function () {
        var saveD = ayepromise.defer();
        saveP = saveD.promise;
        var contentD = ayepromise.defer();
        contentP = contentD.promise;
        var disabledD = ayepromise.defer();
        disabledP = disabledD.promise;

        tbox.save();
        statusE.html().should.be.eql('(saving...)');
        saveE.css('display').should.be.eql('none');
        saveD.resolve(true);
        return utils.pDelay(1)
            .then(function () {
                statusE.html().should.be.eql('(loading...)');
                contentD.resolve('55');
                return utils.pDelay(1);
            })
            .then(function () {
                statusE.html().should.be.eql('(checking access...)');
                disabledD.resolve(false);
                return utils.pDelay(1);
            })
            .then(function () {
                statusE.html().should.be.eql('');
                saveE.css('display').should.not.be.eql('none');
            });
    });

    it('should report errors', function () {
        $('#error-message').html('');
        contentP = utils.pReject(Error('Request failed'));
        mocking.mock('console.log');
        return tbox.load().then(function () {
            statusE.html().should.be.eql('(load failed)');
            $('#error-message').html().should.be.eql('Server not available');
        });
    });

    it('should report errors on save', function () {
        $('#error-message').html('');
        saveP = utils.pReject(Error('Boo'));
        mocking.mock('console.log');
        return tbox.save().then(function () {
            $('#error-message').html().should.be.eql('Boo');
            statusE.html().should.be.eql('(save failed)');
            saveE.css('display').should.not.be.eql('none');
        });
    });
});
