/*
 * Utils for text processing.
 */

var _ = require('lodash');

/* Parse colon-separated multiline string. */
function parseCSV(data, fields) {
    var lines = data.split('\n').filter((l) => l && l[0] !== '#');
    return lines
        .map((line) => line.split(':'))
        .map((l) => _.mapValues(_.invert(fields), (v) => l[v] || ''));
}

/* Do the reverse of ``parseCSV``. */
function unparseCSV(records, fields) {
    return records.map((r) => fields.map((f) => r[f]).join(':')).join('\n');
}

module.exports = {
    parseCSV: parseCSV,
    unparseCSV: unparseCSV
};
