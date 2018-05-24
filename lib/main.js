// ESM syntax is supported.
// export {};

/**
 * @module list-pagination
*/

const {schema} = require('./schema');

module.exports = {
  ...require('./middleware'),
  ...require('./cursor'),
  schema(...options) {
    return ((joi) => (...args) => joi.validate(...args))(schema(...options));
  }
};
