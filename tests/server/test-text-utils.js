/*
 * Test to check text utils.
 */

'use strict';

require('should');
var tu = require('../../server/text-utils');

describe('Text utils', function () {

    var records = [
        {a: 'abc', b: 'def', c: 'ghi'},
        {a: '123', b: '456', c: ''},
        {a: '1', b: '', c: '3'}
    ];

    it('should parse CSV', function () {
        var raw = 'abc:def:ghi\n\n# aaa:bbb:ccc\n123:456\n1::3:4';
        var parsed = tu.parseCSV(raw, ['a', 'b', 'c']);
        parsed.should.be.eql(records);
    });

    it('should unparse CSV', function () {
        var raw = tu.unparseCSV(records, ['a', 'c', 'b']);
        raw.should.be.eql('abc:ghi:def\n123::456\n1:3:');
    });
});
