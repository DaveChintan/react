var crypto = require('crypto');
var config = require('../config/config');
var key = config.ENCRYPT_KEY;

exports.has = Object.prototype.hasOwnProperty;
exports.encrypt = function (text) {
    var cipher = crypto.createCipher('aes-256-ctr', key);
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
};

exports.decrypt = function (text) {
    var decipher = crypto.createDecipher('aes-256-ctr', key)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
};

exports.uniqueId = function () {
    return crypto.randomBytes(20).toString('hex');
}