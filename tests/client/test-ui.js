/*
 * Tests for ui.
 */

describe('UI utils', function () {

    'use strict';

    var ui = window.registry.ui;

    var view;

    beforeEach(function () {
        view = {
            activeViewName: ko.observable('')
        };

        ui.setSubViews(view, {
            foo: function () {return {name: 'foo'};},
            bar: function () {return {name: 'bar'};},
            baz: function () {return {name: 'baz'};}
        });
    });

    function ensureSelected(name) {
        view.activeView().name.should.be.eql(name);
        ['foo', 'bar', 'baz'].forEach(function (n) {
            (view[n]() ? true : false).should.be.eql(name === n);
        });
    }

    it('should create subviews', function () {
        view.activeViewName('foo');
        ensureSelected('foo');
        view.activeViewName('bar');
        ensureSelected('bar');
        view.activeViewName('baz');
        ensureSelected('baz');
    });

    it('should recreate subviews after change', function () {
        view.activeViewName('foo');
        view.activeView().mark = 1;
        view.activeViewName('bar');
        view.activeViewName('foo');
        (view.activeView().mark === undefined).should.be.ok;
    });

    it('should not recreate subviews if no change', function () {
        view.activeViewName('foo');
        view.activeView().mark = 1;
        view.activeViewName('foo');
        view.activeView().mark.should.be.eql(1);
    });

});
