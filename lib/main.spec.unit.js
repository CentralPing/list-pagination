const {compose, decompose, schema} = require('./main');

describe('[Unit] `main`', () => {
  it('should export a `compose` function', () => {
    expect(compose).toBeInstanceOf(Function);
  });

  it('should export a `decompose` function', () => {
    expect(decompose).toBeInstanceOf(Function);
  });

  it('should export a `schema` function', () => {
    expect(schema).toBeInstanceOf(Function);
  });
});
