/*
 * Tests for moderator ui.
 */

describe('Moderator UI', function () {

    'use strict';

    var mocking = window.registry.mocking;
    var utils = window.registry.utils;
    var ui = window.registry.ui;

    var list0 = '1:x:a@b.c:A:moderator';
    var expect0 = '<em>no voters</em>';
    var list2 = '1:x:a@b.c:A:moderator\n5:y:b@c.d:B:voter\n8:z:c@d.e:C:voter';
    var expect2 = '5. B &lt;b@c.d&gt;<br>\n8. C &lt;c@d.e&gt;';
    var storeData;

    beforeEach(function () {
        storeData = {};
        mocking.mock('store.read', function (key) {
            if (key in storeData) {
                return utils.pResolve(storeData[key]);
            } else {
                return utils.pReject(Error('Missing key: ' + key));
            }
        });
        mocking.mock('store.write', function (key, data) {
            storeData[key] = data;
            return utils.pResolve(true);
        });
        $('#stuff').html(
            '<div id="mod-voter-list"></div>' +
            '<p id="new-voters"><textarea id="new-voters-content"></textarea></p>');
        ui.setState('loading');
    });

    afterEach(mocking.unmockAll);

    it('should load voters list', function () {
        storeData.users = list2;
        return ui.setState('mod-voters').then(function () {
            $('#mod-voter-list').html().should.be.eql(expect2);
        });
    });

    it('should load empty voters list', function () {
        storeData.users = list0;
        return ui.setState('mod-voters').then(function () {
            $('#mod-voter-list').html().should.be.eql(expect0);
        });
    });

    it('should add voters to the list', function () {
        storeData.users = list2;
        return ui.setState('mod-voters').then(function () {
            $('#new-voters-content').val('D:d@e.f\nE:e@f.g');
            return ui.currentStateScope.newVoters.save();
        })
        .then(function () {
            var users = utils.parseUserList(storeData.users);
            users.length.should.be.eql(5);
            users[3].name.should.be.eql('D');
            users[3].id.should.be.eql('9');
            users[4].name.should.be.eql('E');
            users[4].id.should.be.eql('10');
            $('#mod-voter-list').html().should.startWith(expect2 + '<br>\n');
            $('#new-voters-content').val().should.be.eql('');
            storeData['init-passwords'].should.startWith('\n9:');
        });
    });

    it('should add init passwords for new users', function () {
        storeData['init-passwords'] = '5:xxx';
        storeData.users = list2;
        return ui.setState('mod-voters').then(function () {
            $('#new-voters-content').val('D:d@e.f\nE:e@f.g');
            return ui.currentStateScope.newVoters.save();
        })
        .then(function () {
            storeData['init-passwords'].should.startWith('5:xxx\n9:');
        });
    });

    it('should detect duplicate emails', function () {
        mocking.mock('console.log');
        storeData.users = list2;
        return ui.setState('mod-voters').then(function () {
            $('#new-voters-content').val('X:b@c.d');
            return ui.currentStateScope.newVoters.save();
        }).then(function () {
            $('#error-message').html().should.be.eql('Duplicate email: b@c.d');
        });
    });
});
