const Joi = require('joi');

const joiExtension = require('./joi-extension');

exports.schema = schema;

/**
 * Configures the schema for validating pagination query parameters.
 * @param {Object} options
 * @param {*} [options.countValid='1'] Indicates what a truthy value is (outside
 *  of `true`). Can be a single value or an array of values.
 * @param {Number} [options.max=25] The maximum and default list items
 *  allowed.
 * @param {(String|String[])} [options.sort] The default field(s) to sort
 *  the list by.
 * @param {(String|String[])} [options.sortValid=[]] The allowed fields to
 *  sort the list by. The schema will automatically match descending annotation
 *  (i.e. `-id`).
 * @param {String} [options.uuidKey=id] The unique ID key.
 * @param {Object} [options.filterSchema]
 * @param {String} [options.secret]
 * @return {Object} Joi schema
 */
function schema({
  uuidKey = 'id',
  countValid = '1',
  max = 25,
  sort = [],
  sortValid = ['.+'],
  filterSchema,
  secret
} = {}) {
  const sortItems = [].concat(sortValid).map(
    (field) => Joi.string()
      .regex(RegExp(`^-?${field}$`, 'i'))
  );
  const sortDefault = [].concat(sort, uuidKey);

  const pageSchema = {
    limit: Joi.number()
      .integer()
      .min(1)
      .max(max)
      .required(),
    sort: Joi.array()
      .single()
      .unique()
      .items(sortItems.concat(uuidKey))
      .required(),
    filter: Joi.object(filterSchema)
      .required(),
    type: Joi.string()
      .valid([
        'first',
        'next',
        'prev'
      ])
      .required(),
    cursors: Joi.array()
      .items(
        Joi.string(),
        Joi.number()
      )
      .required()
      .when('type', {
        is: 'first',
        then: Joi.array().length(0),
        otherwise: Joi.array().min(1)
      }),
    // JWT optional payload properties
    iat: Joi.number(),
    exp: Joi.number()
  };

  return Joi.alternatives().when(
    Joi.object({
      count: Joi.any(),
      page: Joi.any()
    }).xor(['count', 'page']),
    {
      then: Joi.object({
        count: Joi.boolean()
          .truthy(countValid)
          .invalid(false),
        page: joiExtension.jwt()
          .verify(pageSchema, secret)
          .strip()
      }).when('page', {
        is: Joi.object(),
        then: Joi.object({
          limit: Joi.number()
            .default(Joi.ref('page.limit')),
          sort: Joi.array()
            .default(Joi.ref('page.sort')),
          filter: Joi.object()
            .default(Joi.ref('page.filter')),
          type: Joi.string()
            .default(Joi.ref('page.type')),
          cursors: Joi.array()
            .default(Joi.ref('page.cursors')),
          iat: Joi.number()
            .default(Joi.ref('page.iat')),
          exp: Joi.number()
            .default(Joi.ref('page.exp'))
        })
      }),
      otherwise: Joi.object({
        limit: Joi.number()
          .integer()
          .min(1)
          .max(max)
          .default(max),
        sort: joiExtension.array()
          .single()
          .unique()
          .items(sortItems)
          .include(uuidKey)
          .default(sortDefault),
        filter: Joi.object(filterSchema)
          .default(),
        count: Joi.any()
          .forbidden(),
        page: Joi.any()
          .forbidden()
      })
    }
  );
}
