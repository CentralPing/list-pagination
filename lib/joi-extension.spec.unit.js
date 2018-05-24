const Joi = require('joi');
const {sign} = require('jsonwebtoken');

const joiExtension = require('./joi-extension');

describe('[Unit] `joiExtension`', () => {
  it('should export a Joi object', () => {
    expect(joiExtension).toBeInstanceOf(Object);
    expect(joiExtension.jwt).toBeInstanceOf(Function);
    expect(joiExtension.array).toBeInstanceOf(Function);
  });

  describe('with `jwt`', () => {
    it('should validate signed and unsigned token formats', () => {
      const schema = joiExtension.jwt();

      const {error: err1, value: val1} = schema.validate();
      expect(err1).toBeNull();
      expect(val1).toBeUndefined();

      const {error: err2} = schema.validate('abc');
      expect(err2).not.toBeNull();
      /* eslint-disable-next-line max-len */
      expect(err2.message).toBe('"value" with value "abc" fails to match the token pattern');

      const unsignedToken = sign({foo: '123'}, undefined, {algorithm: 'none'});
      const {error: err3, value: val3} = schema.validate(unsignedToken);
      expect(err3).toBeNull();
      expect(val3).toEqual(unsignedToken);

      const signedToken = sign({foo: '123'}, 'foo');
      const {error: err4, value: val4} = schema.validate(signedToken);
      expect(err4).toBeNull();
      expect(val4).toEqual(signedToken);
    });

    it('should verify tokens are unsigned', () => {
      const schema = joiExtension.jwt().verify({foo: Joi.string()});

      const {error: err1, value: val1} = schema.validate();
      expect(err1).toBeNull();
      expect(val1).toBeUndefined();

      const unsignedToken = sign(
        {foo: '123'},
        undefined,
        {algorithm: 'none', noTimestamp: true}
      );
      const {error: err2, value: val2} = schema.validate(unsignedToken);
      expect(err2).toBeNull();
      expect(val2).toEqual({foo: '123'});

      const {error: err3, value: val3} = schema.validate(
        unsignedToken,
        {convert: false}
      );
      expect(err3).toBeNull();
      expect(val3).toEqual(unsignedToken);

      const signedToken = sign({foo: '123'}, 'foo');
      const {error: err4} = schema.validate(signedToken);
      expect(err4).not.toBeNull();
      /* eslint-disable-next-line max-len */
      expect(err4.message).toBe('"value" verification failed: secret or public key must be provided');

      const {error: err5} = schema.validate(signedToken, {convert: false});
      expect(err5).not.toBeNull();
      /* eslint-disable-next-line max-len */
      expect(err5.message).toBe('"value" verification failed: secret or public key must be provided');
    });

    it('should verify tokens are signed', () => {
      const schema = joiExtension.jwt().verify({foo: Joi.string()}, 'foo');

      const {error: err1, value: val1} = schema.validate();
      expect(err1).toBeNull();
      expect(val1).toBeUndefined();

      const unsignedToken = sign(
        {foo: '123'},
        undefined,
        {algorithm: 'none', noTimestamp: true}
      );
      const {error: err2} = schema.validate(unsignedToken);
      expect(err2).not.toBeNull();
      /* eslint-disable-next-line max-len */
      expect(err2.message).toBe('"value" verification failed: jwt signature is required');

      const {error: err3} = schema.validate(unsignedToken, {convert: false});
      expect(err3).not.toBeNull();
      /* eslint-disable-next-line max-len */
      expect(err3.message).toBe('"value" verification failed: jwt signature is required');

      const signedToken = sign({foo: '123'}, 'foo', {noTimestamp: true});
      const {error: err4, value: val4} = schema.validate(signedToken);
      expect(err4).toBeNull();
      expect(val4).toEqual({foo: '123'});

      const {error: err5, value: val5} = schema.validate(
        signedToken,
        {convert: false}
      );
      expect(err5).toBeNull();
      expect(val5).toEqual(signedToken);
    });
  });

  describe('with `array`', () => {
    it('should validate arrays', () => {
      const schema = joiExtension.array();

      const {error: err1, value: val1} = schema.validate();
      expect(err1).toBeNull();
      expect(val1).toBeUndefined();

      const {error: err2} = schema.validate('abc');
      expect(err2).not.toBeNull();
      expect(err2.message).toBe('"value" must be an array');

      const {error: err3, value: val3} = schema.validate([]);
      expect(err3).toBeNull();
      expect(val3).toEqual([]);
    });

    it('should include values', () => {
      const schema = joiExtension.array().include('foo');

      const {error: err1, value: val1} = schema.validate();
      expect(err1).toBeNull();
      expect(val1).toBeUndefined();

      const {error: err2} = schema.validate('abc');
      expect(err2).not.toBeNull();
      expect(err2.message).toBe('"value" must be an array');

      const {error: err3, value: val3} = schema.validate([]);
      expect(err3).toBeNull();
      expect(val3).toEqual(['foo']);

      const {error: err4} = schema.validate(['foo']);
      expect(err4).not.toBeNull();
      /* eslint-disable-next-line max-len */
      expect(err4.message).toBe('"value" at position 0 fails because ["0" with value "foo" cannot be an included value]');


      const {error: err5} = schema.validate(['-foo']);
      expect(err5).not.toBeNull();
      /* eslint-disable-next-line max-len */
      expect(err5.message).toBe('"value" at position 0 fails because ["0" with value "-foo" cannot be an included value]');

      const {error: err6, value: val6} = schema.validate(['bar']);
      expect(err6).toBeNull();
      expect(val6).toEqual(['bar', 'foo']);

      const {error: err7, value: val7} = schema.validate(
        ['bar'],
        {convert: false}
      );
      expect(err7).toBeNull();
      expect(val7).toEqual(['bar']);
    });
  });
});
