/*
 * Test that the framework works.
 */

describe('Testing ', function () {
    it('should work', function () {
        [1, 2].should.eql([1, 2]);
    });

    it('should test libraries', function () {
        votegrity.helloWorld().should.eql('Hello world!');
    });

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

