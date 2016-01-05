/*
 * Test that the framework works.
 */

describe('Testing ', function () {

    'use strict';

    it('should work with promises', function () {
        var d = ayepromise.defer();
        var p = d.promise;
        var ret = p.then(function (value) {
            value.should.be.eql(true);
        });
        d.resolve(true);
        return ret;
    });
});

