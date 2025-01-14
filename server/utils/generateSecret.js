const crypto = require('crypto');

function generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

module.exports = generateSecureSecret;