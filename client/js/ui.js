/*
 * Votegrity ui utilities.
 */

(function (registry) {

    'use strict';

    var ui = registry.ui = {};

    /*
     * Add ``activeView`` observable that will autoinstantiate current
     * view based on ``self.activeViewName()`` and proxy observables
     * for all the subviews.
     */
    ui.setSubViews = function (self, viewMap) {

        self.activeView = ko.pureComputed(function () {
            var name = self.activeViewName();
            var constructor = viewMap[name];

            if (constructor) {
                return constructor(self);
            }
        });

        function makeSubviewProxy(name) {
            return ko.pureComputed(function () {
                var activeView = self.activeView();
                if (self.activeViewName() === name) {
                    return activeView;
                }
            });
        }

        for (var name in viewMap) {
            self[name] = makeSubviewProxy(name);
        }
    };

    /* Make the list of menu items for subviews. */
    ui.makeMenu = function (self, items) {
        return ko.observable(items.map(function (item) {
            return {
                name: item.name,
                action: function () {
                    self.activeViewName(item.view);
                }
            };
        }));
    };

})(this.registry);
