/*
 * Counter UI.
 */

(function (registry) {

    'use strict';

    var utils = registry.utils;
    var store = registry.store;
    var ui = registry.ui;

    var cnt = registry.cnt = {};

    function updateInfo(id, value) {
        var info = $('#' + id);
        var title = info.html().split(':')[0];
        info.html(title + ': ' + value);
    }

    function loadIssuanceStatus() {
        return store.read('ballots.acl', '').then(function (acl) {
            cnt.status = acl.indexOf('counter:write') !== -1 ?
                        'enabled' :
                        'disabled';
            updateInfo('cnt-ballot-issuance', cnt.status);
        });
    }

    function loadVotersRegistered() {
        return store.read('users', '').then(function (userList) {
            var users = utils.parseUserList(userList);
            cnt.votersCount = users
                .filter(function (u) {return u.role === 'voter';}).length;
            updateInfo('cnt-voters-count', cnt.votersCount);
        });
    }

    function loadBallotsIssued() {
        return store.read('ballots', '').then(function (ballots) {
            cnt.ballotsCount = 0 && ballots;
            updateInfo('cnt-ballots-count', cnt.ballotsCount);
        });
    }

    cnt.initIssuance = function () {
        return utils.pAll([
            loadIssuanceStatus(),
            loadVotersRegistered(),
            loadBallotsIssued()
        ]).then(function () {
            var canIssue = cnt.status === 'enabled' &&
                    cnt.votersCount > cnt.ballotsCount;
            updateInfo('cnt-ballots-to-issue-count',
                cnt.votersCount - cnt.ballotsCount);

            if (canIssue) {
                $('#cnt-issue-ballots').show();
            } else {
                $('#cnt-issue-ballots').hide();
            }
            $('#cnt-issuance').hide();
        });
    };

    function issueBallots() {
        $('#cnt-issuance').show();
    }

    function issueBallots2() {
        window.alert('yay!');
    }

    $(document).ready(function () {
        var cntMenu = [
            {name: 'Ballots issuance', state: 'cnt-ballots'},
            {name: 'Counting and publishing results', state: 'cnt-count'}
        ];
        ui.addState('cnt-main', {
            divs: ['cnt-main'],
            menu: cntMenu
        });
        ui.addState('cnt-ballots', {
            divs: ['cnt-ballots'],
            menu: cntMenu,
            onEnter: function () {
                $('#cnt-issuance').hide();
                $('#cnt-issue-ballots').click(issueBallots);
                $('#cnt-issue-ballots-2').click(issueBallots2);
                return cnt.initIssuance();
            }
        });
        ui.addState('cnt-count', {
            divs: ['cnt-count'],
            menu: cntMenu
        });
    });

})(this.registry);
