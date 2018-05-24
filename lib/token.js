const {sign, verify} = require('jsonwebtoken');

exports.encode = encode;
exports.decode = decode;

/**
 * @example
 * const token = encode({foo: 'bar'});
 * @param {Object} payload
 * @param {Object} [options]
 * @param {String} [options.secret] A string to sign the JWT.
 * @param {String|Number} [options.expiresIn]
 * @param {Boolean} [options.noTimestamp=true]
 * @return {Object} {error, value}
 */
function encode(payload, {
  secret,
  expiresIn,
  noTimestamp = expiresIn !== undefined ? false : true
} = {}) {
  const options = {noTimestamp};

  // Undefined expiresIn results in`sign` throwing an error
  if (expiresIn !== undefined) {
    options.expiresIn = expiresIn;
  }

  // Undefined algorithm in `sign` throwing an error
  if (secret === undefined) {
    options.algorithm = 'none';
  }

  try {
    const token = sign(payload, secret, options);
    return {error: null, value: token};
  } catch (error) {
    return {error};
  }
}

/**
 * @example
 * const decoded = decode(token);
 * @param {String} token
 * @param {String} [secret] A string to verify the JWT.
 * @return {Object}
 */
function decode(token, secret) {
  try {
    const value = verify(token, secret);
    return {error: null, value};
  } catch (error) {
    return {error};
  }
}
