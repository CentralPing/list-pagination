const {encode, decode} = require('./token');

const tokenRegExp = /^.+[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+\.$/;
const signedTokenRegExp = /^.+[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+$/;

describe('[Unit] `token`', () => {
  it('should export `encode` and `decode` functions', () => {
    expect(encode).toBeInstanceOf(Function);
    expect(decode).toBeInstanceOf(Function);
  });

  it('should return an error with no params to `encode`', () => {
    const {error} = encode();

    expect(error).not.toBeNull();
    expect(error.message).toBe('payload is required');
  });

  it('should return an error without a token to `decode`', () => {
    const {error} = decode();

    expect(error).not.toBeNull();
    expect(error.message).toEqual('jwt must be provided');
  });

  it('should return an error with a malformed token to `decode`', () => {
    const {error} = decode('foo');

    expect(error).not.toBeNull();
    expect(error.message).toEqual('jwt malformed');
  });

  it('should encode and decode an unsigned token with a payload', () => {
    const {error: errEn, value: valEn} = encode({foo: 'bar'});
    expect(errEn).toBeNull();
    expect(valEn).toEqual(expect.stringMatching(tokenRegExp));

    const {error: errDe, value: valDe} = decode(valEn);
    expect(errDe).toBeNull();
    expect(valDe).toEqual({
      foo: 'bar'
    });
  });

  it('should set an optional issued at timestamp ', () => {
    const {value: valEn} = encode({}, {noTimestamp: false});
    const {value: valDe} = decode(valEn);
    expect(valDe).toEqual({
      iat: expect.any(Number)
    });
  });

  it('should set an optional expiration ', () => {
    const {value: valEn} = encode({}, {expiresIn: '5m'});
    const {value: valDe} = decode(valEn);

    expect(valDe).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number)
    });
  });

  it('should set an optional expiration without issued at timestamp', () => {
    const {value: valEn} = encode({}, {noTimestamp: true, expiresIn: '5s'});
    const {value: valDe} = decode(valEn);

    expect(valDe).toEqual({
      exp: expect.any(Number)
    });
  });

  it('should return an error with an expired token', () => {
    const {value: val1} = encode({}, {expiresIn: '-1s'});
    const {error: err1} = decode(val1);

    expect(err1).not.toBeNull();
    expect(err1.message).toEqual('jwt expired');

    const {value: val2} = encode({}, {noTimestamp: true, expiresIn: '-1s'});
    const {error: err2} = decode(val2);

    expect(err2).not.toBeNull();
    expect(err2.message).toEqual('jwt expired');
  });

  it('should optional sign the token ', () => {
    const {value: valEn} = encode({foo: 'bar'}, {secret: 'foo'});
    expect(valEn).toEqual(expect.stringMatching(signedTokenRegExp));

    const {error} = decode(valEn, 'bar');
    expect(error).not.toBeNull();
    expect(error.message).toEqual('invalid signature');

    const {value: valDe} = decode(valEn, 'foo');
    expect(valDe).toEqual({
      foo: 'bar'
    });
  });
});
