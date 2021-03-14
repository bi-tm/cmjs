const config   = require('./config.json')
    , crypto   = require('crypto')
    ;

module.exports = function _hashPassword(password) {
    return crypto.scryptSync(password, config.salt, 32).toString('base64');
}
  