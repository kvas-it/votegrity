/*
 * Test to check crypto utils.
 */

'use strict';

require('should');
var cu = require('../../server/crypto-utils');

describe('Text utils', function () {

    it('should hash', function () {
        cu.hash('123').should.be.eql('pmWkWSBCL51Bfkhn79xPuKBKHzH6Bm');
        var s = '123';
        for (var i = 0; i < 500; i++) {
            s = cu.hash(s);
            s.length.should.be.eql(30);
        }
    });

});
