const Joi = require('joi');
const {decompose} = require('./cursor');

module.exports = Joi.extend({
  /* eslint-disable-next-line max-len */
  base: Joi.string().regex(/^.+[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]{0,}$/, 'token'),
  name: 'jwt',
  language: {
    verify: 'verification failed: {{m}}',
    validate: 'validation failed: {{m}}'
  },
  rules: [{
    name: 'verify',
    params: {
      schema: Joi.object().required(),
      secret: Joi.string()
    },
    validate({schema, secret}, token, state, options) {
      const {error: errDecode, value: payload} = decompose(token, secret);

      if (errDecode !== null) {
        return this.createError(
          'jwt.verify',
          {m: errDecode.message},
          state,
          options
        );
      }

      const {error, value} = Joi.validate(payload, schema, options);

      if (error !== null) {
        return this.createError(
          'jwt.validate',
          {m: error.message},
          state,
          options
        );
      }

      if (options.convert) return value;

      return token;
    }
  }]
}).extend({
  base: Joi.array(),
  name: 'array',
  language: {
    /* eslint-disable-next-line max-len */
    dupe: 'at position {{i}} fails because ["{{i}}" with value "{{v}}" cannot be an included value]'
  },
  rules: [{
    name: 'include',
    params: {
      values: Joi.array().items().single().min(1).required()
    },
    validate({values}, value, state, options) {
      if (options.convert) {
        const dupeIndex = value.findIndex(
          (v) => values.includes(v.replace(/^[+-]/, ''))
        );

        if (dupeIndex > -1) {
          return this.createError(
            'array.dupe',
            {v: value[dupeIndex], i: dupeIndex},
            state,
            options
          );
        }

        return [].concat(value, values);
      }

      return value;
    }
  }]
});
