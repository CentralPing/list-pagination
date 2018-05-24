const {query} = require('express-joi');

const {compose: cursorCompose} = require('./cursor');
const {schema} = require('./schema');

exports.tokenize = tokenize;
exports.validate = validate;

/**
 * Configures Express middleware for composing optional pagination tokens.
 * @param {Object} [options]
 * @param {String} [options.readFrom=query]
 * @param {String} [options.writeTo=pagination]
 * @param {String} [options.uuidKey]
 * @param {String} [options.secret]
 * @return {Function} Configured Express middleware
 */
function tokenize({
  readFrom = 'query',
  writeTo = 'pagination',
  uuidKey,
  secret
} = {}) {
  return (req, {locals}, next) => {
    const {[readFrom]: readRef, list} = locals;

    if (!readRef.count) {
      const {error, value} = cursorCompose(readRef, list, {uuidKey, secret});

      if (error !== null) return next(error);

      locals[writeTo] = {...locals[writeTo], ...value};
    }

    next();
  };
}

/**
 * Configures Express middleware for validating pagination query parameters.
 * @param {Object} options
 * @param {*} [options.countValid='1'] Indicates what a truthy value is (outside
 *  of `true`). Can be a single value or an array of values.
 * @param {Number} [options.max=25] The maximum and default list items
 *  allowed.
 * @param {(String|String[])} [options.sort=id] The default field(s) to sort
 *  the list by.
 * @param {(String|String[])} [options.sortValid=[id]] The allowed fields to
 *  sort the list by. The schema will automatically match descending annotation
 *  (i.e. `-id`).
 * @return {Function} Configured Express middleware
 */
function validate(options) {
  return query(schema(options));
}
