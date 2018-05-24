const {tokenize, validate} = require('./middleware');

const tokenRegExp = /^.+[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+\.$/;

describe('[Unit] `middleware`', () => {
  let req;
  let res;
  let next;

  beforeAll(() => {
    next = jest.fn().mockName('next');
  });

  beforeEach(() => {
    req = {query: {}};
    res = {locals: {}};
    next.mockClear();
  });

  it('should export `tokenize` and `validate` functions', () => {
    expect(tokenize).toBeInstanceOf(Function);
    expect(validate).toBeInstanceOf(Function);
  });

  it('should return middleware for `tokenize`', () => {
    const middleware = tokenize();

    expect(middleware).toBeInstanceOf(Function);
    expect(middleware).toHaveLength(3);
  });

  it('should return middleware for `validate`', () => {
    const middleware = validate();

    expect(middleware).toBeInstanceOf(Function);
    expect(middleware).toHaveLength(3);
  });

  describe('with configured middleware', () => {
    let middlewareTokenize;
    let middlewareValidate;

    beforeAll(() => {
      middlewareTokenize = tokenize();
      middlewareValidate = validate();
    });

    describe('with requests', () => {
      it('should validate but not compose tokens if request is a count', () => {
        req.query = {
          count: true
        };

        middlewareValidate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(res.locals.query).toEqual({
          count: true
        });

        next.mockClear();
        middlewareTokenize(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(res.locals.pagination).toBeUndefined();
      });

      /* eslint-disable-next-line max-len */
      it('should validate and compose tokens with non page/count request', () => {
        req.query = {
          limit: '3',
          sort: 'foo',
          filter: {foo: 'bar'}
        };

        middlewareValidate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(res.locals.query).toEqual({
          limit: 3,
          sort: ['foo', 'id'],
          filter: {foo: 'bar'}
        });

        res.locals.list = [{id: 1}, {id: 2}, {id: 3}];

        next.mockClear();
        middlewareTokenize(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(res.locals.pagination).toEqual({
          self: expect.stringMatching(tokenRegExp),
          first: expect.stringMatching(tokenRegExp),
          next: expect.stringMatching(tokenRegExp)
        });
      });

      it('should validate and compose tokens with page request', () => {
        res.locals.query = {
          limit: 3,
          sort: ['foo', 'id'],
          filter: {foo: 'bar'}
        };
        res.locals.list = [{id: 1}, {id: 2}, {id: 3}];

        middlewareTokenize(req, res, next);

        req.query = {
          page: res.locals.pagination.next
        };
        res.locals = {};

        next.mockClear();
        middlewareValidate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(res.locals.query).toEqual({
          limit: 3,
          sort: ['foo', 'id'],
          filter: {foo: 'bar'},
          cursors: [3],
          type: 'next'
        });

        res.locals.list = [{id: 4}, {id: 5}, {id: 6}];

        next.mockClear();
        middlewareTokenize(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(res.locals.pagination).toEqual({
          self: expect.stringMatching(tokenRegExp),
          first: expect.stringMatching(tokenRegExp),
          next: expect.stringMatching(tokenRegExp),
          prev: expect.stringMatching(tokenRegExp)
        });
      });
    });
  });
});
