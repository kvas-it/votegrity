/*
 * Tests for crypto utils.
 */

describe('Crypto utils', function () {

    'use strict';

    var crypto = window.registry.crypto;

    it('should calculate hashes', function () {
        crypto.hash('123').should.be.eql('pmWkWSBCL51Bfkhn79xPuKBKHz//H6');
    });
});

