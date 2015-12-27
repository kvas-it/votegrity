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
});

