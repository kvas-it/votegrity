/*
 * Cryptography utils.
 */

var crypto = require('crypto');

/* SHA256 -> BASE64 -> truncate to 30 */
function hash(plainText) {
    return crypto.createHash('sha256')
        .update(plainText, 'utf8')
        .digest('base64')
        .replace(/[\/\+]/g, '')
        .substr(0, 30);
}

module.exports = {
    hash: hash
};
