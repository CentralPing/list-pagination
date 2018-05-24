const {tokenize, validate, compose, decompose, schema} = require('./main');

describe('[Unit] `main`', () => {
  it('should export a `tokenize` function', () => {
    expect(tokenize).toBeInstanceOf(Function);
  });

  it('should export a `validate` function', () => {
    expect(validate).toBeInstanceOf(Function);
  });

  it('should export a `compose` function', () => {
    expect(compose).toBeInstanceOf(Function);
  });

  it('should export a `decompose` function', () => {
    expect(decompose).toBeInstanceOf(Function);
  });

  describe('with `schema`', () => {
    it('should be a function', () => {
      expect(schema).toBeInstanceOf(Function);
    });

    it('should return a validation function', () => {
      const validate = schema();

      expect(validate).toBeInstanceOf(Function);

      const {error, value} = validate({});
      expect(error).toBeNull();
      expect(value).toEqual({
        filter: {},
        limit: 25,
        sort: ['id']
      });
    });
  });
});
