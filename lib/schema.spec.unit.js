const Joi = require('joi');
const {sign} = require('jsonwebtoken');

const {schema} = require('./schema');

describe('[Unit] `schema`', () => {
  it('should export a function', () => {
    expect(schema).toBeInstanceOf(Function);
  });

  describe('with default schema', () => {
    let joiSchema;

    beforeAll(() => {
      joiSchema = schema();
    });

    it('should return a joiSchema.validate function', () => {
      expect(joiSchema.validate).toBeInstanceOf(Function);
    });

    it('should joiSchema.validate and set defaults for an empty object', () => {
      const {error, value} = joiSchema.validate({});

      expect(error).toBeNull();
      expect(value).toEqual({
        filter: {},
        limit: 25,
        sort: ['id']
      });
    });
  });

  describe('with validation', () => {
    let joiSchema;

    beforeAll(() => {
      joiSchema = schema();
    });

    describe('with `limit`', () => {
      it('should joiSchema.validate with in-range values', () => {
        const {error: err1, value: val1} = joiSchema.validate({limit: '1'});
        expect(err1).toBeNull();
        expect(val1).toEqual({
          filter: {},
          limit: 1,
          sort: ['id']
        });

        const {error: err2, value: val2} = joiSchema.validate({limit: '15'});
        expect(err2).toBeNull();
        expect(val2).toEqual({
          filter: {},
          limit: 15,
          sort: ['id']
        });

        const {error: err3, value: val3} = joiSchema.validate({limit: '25'});
        expect(err3).toBeNull();
        expect(val3).toEqual({
          filter: {},
          limit: 25,
          sort: ['id']
        });
      });

      it('should injoiSchema.validate with out-of-range values', () => {
        const {error: err1} = joiSchema.validate({limit: '0'});
        expect(err1).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err1.message).toBe('child "limit" fails because ["limit" must be larger than or equal to 1]');

        const {error: err2} = joiSchema.validate({limit: '26'});
        expect(err2).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err2.message).toBe('child "limit" fails because ["limit" must be less than or equal to 25]');
      });
    });

    describe('with `sort`', () => {
      /* eslint-disable-next-line max-len */
      it('should joiSchema.validate with allowed values (any by default)', () => {
        const {error: err1, value: val1} = joiSchema.validate({sort: 'foo'});
        expect(err1).toBeNull();
        expect(val1).toEqual({
          filter: {},
          limit: 25,
          sort: ['foo', 'id']
        });
      });

      /* eslint-disable-next-line max-len */
      it('should injoiSchema.validate with unallowed values (only "id" by default)', () => {
        const {error} = joiSchema.validate({sort: ['id']});
        expect(error).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(error.message).toBe('child "sort" fails because ["sort" at position 0 fails because ["0" with value "id" cannot be an included value]]');
      });
    });

    describe('with `count`', () => {
      it('should joiSchema.validate with truthy values', () => {
        const {error: err1, value: val1} = joiSchema.validate({count: 'true'});
        expect(err1).toBeNull();
        expect(val1).toEqual({
          count: true
        });

        const {error: err2, value: val2} = joiSchema.validate({count: '1'});
        expect(err2).toBeNull();
        expect(val2).toEqual({
          count: true
        });
      });

      it('should injoiSchema.validate without truthy values', () => {
        const {error: err1} = joiSchema.validate({count: 'false'});
        expect(err1).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err1.message).toBe('child "count" fails because ["count" contains an invalid value]');

        const {error: err2} = joiSchema.validate({count: 1});
        expect(err2).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err2.message).toBe('child "count" fails because ["count" must be a boolean]');
      });

      it('should be exclusive to all other pagination parameters', () => {
        const {error: err1} = joiSchema.validate({
          count: true,
          limit: 1
        });
        expect(err1).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err1.message).toBe('child "count" fails because ["count" is not allowed]');

        const {error: err2} = joiSchema.validate({
          count: true,
          sort: 'foo'
        });
        expect(err2).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err2.message).toBe('child "count" fails because ["count" is not allowed]');

        const {error: err3} = joiSchema.validate({
          count: true,
          page: 'foo'
        });
        expect(err3).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err3.message).toBe('child "count" fails because ["count" is not allowed]');
      });
    });

    describe('with `page`', () => {
      it('should joiSchema.validate valid values', () => {
        const {error: err1, value: val1} = joiSchema.validate({
          page: sign({
            limit: 1,
            sort: 'id',
            filter: {},
            cursors: [],
            type: 'first'
          }, undefined, {algorithm: 'none'})
        });
        expect(err1).toBeNull();
        expect(val1).toEqual({
          limit: 1,
          sort: ['id'],
          type: 'first',
          filter: {},
          cursors: [],
          iat: expect.any(Number)
        });

        const {error: err2, value: val2} = joiSchema.validate({
          page: sign({
            limit: 1,
            sort: ['id'],
            filter: {},
            cursors: [1],
            type: 'next'
          }, undefined, {algorithm: 'none'})
        });
        expect(err2).toBeNull();
        expect(val2).toEqual({
          limit: 1,
          sort: ['id'],
          type: 'next',
          filter: {},
          cursors: [1],
          iat: expect.any(Number)
        });

        const {error: err3, value: val3} = joiSchema.validate({
          page: sign({
            limit: 1,
            sort: ['id'],
            filter: {},
            cursors: [1],
            type: 'prev'
          }, undefined, {algorithm: 'none'})
        });
        expect(err3).toBeNull();
        expect(val3).toEqual({
          limit: 1,
          sort: ['id'],
          type: 'prev',
          filter: {},
          cursors: [1],
          iat: expect.any(Number)
        });
      });

      it('should injoiSchema.validate invalid values', () => {
        const {error: err1} = joiSchema.validate({page: '😈'});
        expect(err1).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err1.message).toBe('child "page" fails because ["page" with value "😈" fails to match the token pattern]');

        const {error: err2} = joiSchema.validate({
          page: sign({
            limit: 1,
            sort: 'id',
            filter: {},
            cursors: [1],
            type: 'first'
          }, undefined, {algorithm: 'none'})
        });
        expect(err2).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err2.message).toBe('child "page" fails because ["page" validation failed: child "cursors" fails because ["cursors" must contain 0 items]]');

        const {error: err3} = joiSchema.validate({
          page: sign({
            limit: 1,
            sort: 'id',
            filter: {},
            cursors: [],
            type: 'next'
          }, undefined, {algorithm: 'none'})
        });
        expect(err3).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err3.message).toBe('child "page" fails because ["page" validation failed: child "cursors" fails because ["cursors" must contain at least 1 items]]');
      });

      it('should be exclusive to all other pagination parameters', () => {
        const {error: err1} = joiSchema.validate({
          page: 'foo',
          limit: 1
        });
        expect(err1).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err1.message).toBe('child "page" fails because ["page" is not allowed]');

        const {error: err2} = joiSchema.validate({
          page: 'foo',
          sort: 'foo'
        });
        expect(err2).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err2.message).toBe('child "page" fails because ["page" is not allowed]');

        const {error: err3} = joiSchema.validate({
          page: 'foo',
          count: true
        });
        expect(err3).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err3.message).toBe('child "count" fails because ["count" is not allowed]');
      });
    });
  });

  describe('with options', () => {
    describe('with `count`', () => {
      it('should update the allowable truthy values', () => {
        const joiSchema = schema({countValid: ['foo', -1]});

        const {error: err1, value: val1} = joiSchema.validate({count: 'foo'});
        expect(err1).toBeNull();
        expect(val1).toEqual({
          count: true
        });

        const {error: err2, value: val2} = joiSchema.validate({count: -1});
        expect(err2).toBeNull();
        expect(val2).toEqual({
          count: true
        });

        const {error: err3} = joiSchema.validate({count: '1'});
        expect(err3).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err3.message).toBe('child "count" fails because ["count" must be a boolean]');
      });
    });

    describe('with `max`', () => {
      it('should update the max range value', () => {
        const joiSchema= schema({max: 5});

        const {error: err1, value: val1} = joiSchema.validate({limit: '5'});
        expect(err1).toBeNull();
        expect(val1).toEqual({
          filter: {},
          limit: 5,
          sort: ['id']
        });

        const {error: err2} = joiSchema.validate({limit: '6'});
        expect(err2).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err2.message).toBe('child "limit" fails because ["limit" must be less than or equal to 5]');
      });
    });

    describe('with `sort`', () => {
      it('should update the default value', () => {
        const joiSchema = schema({sort: 'foo', sortValid: ['foo']});

        const {error: err1, value: val1} = joiSchema.validate({});
        expect(err1).toBeNull();
        expect(val1).toMatchObject({
          sort: ['foo', 'id']
        });
      });
    });

    describe('with `sortValid`', () => {
      it('should update the allowable values', () => {
        const joiSchema = schema({sortValid: ['foo', 'bar']});

        const {error: err1, value: val1} = joiSchema.validate({sort: 'foo'});
        expect(err1).toBeNull();
        expect(val1).toMatchObject({
          sort: ['foo', 'id']
        });

        const {error: err2, value: val2} = joiSchema.validate({
          sort: ['foo', 'bar']
        });
        expect(err2).toBeNull();
        expect(val2).toMatchObject({
          sort: ['foo', 'bar', 'id']
        });

        const {error: err3} = joiSchema.validate({sort: 'far'});
        expect(err3).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err3.message).toBe('child "sort" fails because [single value of "sort" does not match any of the allowed types]');
      });
    });

    describe('with `filterSchema`', () => {
      it('should update the filter validation', () => {
        const joiSchema = schema({
          filterSchema: {
            foo: Joi.string().default('abc'),
            bar: Joi.number()
          }
        });

        const {error: err1, value: val1} = joiSchema.validate({
          filter: {foo: 'xyz', bar: 123}
        });
        expect(err1).toBeNull();
        expect(val1).toMatchObject({
          filter: {foo: 'xyz', bar: 123}
        });

        const {error: err2} = joiSchema.validate({filter: {foo: 123}});
        expect(err2).not.toBeNull();
        /* eslint-disable-next-line max-len */
        expect(err2.message).toBe('child "filter" fails because [child "foo" fails because ["foo" must be a string]]');
      });
    });
  });
});
