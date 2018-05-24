const {compose, decompose} = require('./cursor');

const tokenRegExp = /^.+[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+\.$/;

describe('[Unit] `cursor`', () => {
  it('should export `compose` and `decompose` functions', () => {
    expect(compose).toBeInstanceOf(Function);
    expect(decompose).toBeInstanceOf(Function);
  });

  it('should not decompose without token', () => {
    const {error, value} = decompose();

    expect(error).toBeNull();
    expect(value).toEqual({});
  });

  describe('with initial request', () => {
    let query;
    let list;

    beforeEach(() => {
      query = {
        limit: 3,
        sort: 'id',
        filter: {foo: 'bar'}
      };
      list = [{id: 1}, {id: 2}, {id: 3}];
    });

    it('should create self and first tokens if list less than limit', () => {
      list.pop();
      const {error, value} = compose(query, list);

      expect(error).toBeNull();
      expect(value).toEqual({
        self: expect.stringMatching(tokenRegExp),
        first: expect.stringMatching(tokenRegExp)
      });

      const {value: payloadSelf} = decompose(value.self);
      expect(payloadSelf).toEqual({
        cursors: [],
        type: 'self',
        ...query
      });

      const {value: payloadFirst} = decompose(value.first);
      expect(payloadFirst).toEqual({
        cursors: [],
        type: 'first',
        ...query
      });
    });

    /* eslint-disable-next-line max-len */
    it('should create self, first and next tokens if list is equal to limit', () => {
      const {error, value} = compose(query, list);

      expect(error).toBeNull();
      expect(value).toEqual({
        self: expect.stringMatching(tokenRegExp),
        first: expect.stringMatching(tokenRegExp),
        next: expect.stringMatching(tokenRegExp)
      });

      const {value: payloadSelf} = decompose(value.self);
      expect(payloadSelf).toEqual({
        cursors: [],
        type: 'self',
        ...query
      });

      const {value: payloadFirst} = decompose(value.first);
      expect(payloadFirst).toEqual({
        cursors: [],
        type: 'first',
        ...query
      });

      const {value: payloadNext} = decompose(value.next);
      expect(payloadNext).toEqual({
        cursors: [3],
        type: 'next',
        ...query
      });
    });
  });

  describe('with next requests', () => {
    let query;
    let list;

    beforeEach(() => {
      query = {
        limit: 3,
        sort: 'id',
        filter: {foo: 'bar'},
        cursors: [3],
        type: 'next'
      };
      list = [{id: 4}, {id: 5}, {id: 6}];
    });

    /* eslint-disable-next-line max-len */
    it('should create self, first and prev token if list less than limit', () => {
      list.pop();
      const {error, value} = compose(query, list);

      expect(error).toBeNull();
      expect(value).toEqual({
        self: expect.stringMatching(tokenRegExp),
        first: expect.stringMatching(tokenRegExp),
        prev: expect.stringMatching(tokenRegExp)
      });

      const {limit, sort, filter} = query;

      const {value: payloadSelf} = decompose(value.self);
      expect(payloadSelf).toEqual({
        cursors: [3],
        type: 'self',
        limit,
        sort,
        filter
      });

      const {value: payloadFirst} = decompose(value.first);
      expect(payloadFirst).toEqual({
        cursors: [],
        type: 'first',
        limit,
        sort,
        filter
      });

      const {value: payloadPrev} = decompose(value.prev);
      expect(payloadPrev).toEqual({
        cursors: [3],
        type: 'prev',
        limit,
        sort,
        filter
      });
    });

    /* eslint-disable-next-line max-len */
    it('should create self, first, next and prev tokens if list is equal to limit', () => {
      const {error, value} = compose(query, list);

      expect(error).toBeNull();
      expect(value).toEqual({
        self: expect.stringMatching(tokenRegExp),
        first: expect.stringMatching(tokenRegExp),
        next: expect.stringMatching(tokenRegExp),
        prev: expect.stringMatching(tokenRegExp)
      });

      const {limit, sort, filter} = query;

      const {value: payloadSelf} = decompose(value.self);
      expect(payloadSelf).toEqual({
        cursors: [3],
        type: 'self',
        limit,
        sort,
        filter
      });

      const {value: payloadFirst} = decompose(value.first);
      expect(payloadFirst).toEqual({
        cursors: [],
        type: 'first',
        limit,
        sort,
        filter
      });

      const {value: payloadNext} = decompose(value.next);
      expect(payloadNext).toEqual({
        cursors: [6, 3],
        type: 'next',
        limit,
        sort,
        filter
      });

      const {value: payloadPrev} = decompose(value.prev);
      expect(payloadPrev).toEqual({
        cursors: [3],
        type: 'prev',
        limit,
        sort,
        filter
      });
    });
  });

  describe('with prev requests', () => {
    let query;
    let list;

    beforeEach(() => {
      query = {
        limit: 3,
        sort: 'id',
        filter: {foo: 'bar'},
        cursors: [6, 3],
        type: 'prev'
      };
      list = [{id: 4}, {id: 5}, {id: 6}];
    });

    it('should create self, first, next and prev tokens', () => {
      const {error, value} = compose(query, list);

      expect(error).toBeNull();
      expect(value).toEqual({
        self: expect.stringMatching(tokenRegExp),
        first: expect.stringMatching(tokenRegExp),
        next: expect.stringMatching(tokenRegExp),
        prev: expect.stringMatching(tokenRegExp)
      });

      const {limit, sort, filter} = query;

      const {value: payloadSelf} = decompose(value.self);
      expect(payloadSelf).toEqual({
        cursors: [6, 3],
        type: 'self',
        limit,
        sort,
        filter
      });

      const {value: payloadFirst} = decompose(value.first);
      expect(payloadFirst).toEqual({
        cursors: [],
        type: 'first',
        limit,
        sort,
        filter
      });

      const {value: payloadNext} = decompose(value.next);
      expect(payloadNext).toEqual({
        cursors: [6, 3],
        type: 'next',
        limit,
        sort,
        filter
      });

      const {value: payloadPrev} = decompose(value.prev);
      expect(payloadPrev).toEqual({
        cursors: [3],
        type: 'prev',
        limit,
        sort,
        filter
      });
    });
  });

  describe('with custom `uuidPath', () => {
    it('should set the uuid path for cursors', () => {
      const query = {
        limit: 3,
        sort: 'id',
        filter: {foo: 'bar'}
      };
      const list = [{foo: 1}, {foo: 2}, {foo: 3}];
      const {value} = compose(query, list, {uuidKey: 'foo'});
      const {value: payloadNext} = decompose(value.next);
      expect(payloadNext).toEqual({
        cursors: [3],
        type: 'next',
        ...query
      });
    });
  });

  describe('with signing tokens', () => {
    it('should sign the tokens', () => {
      const query = {
        limit: 3,
        sort: 'id',
        filter: {foo: 'bar'}
      };
      const list = [{id: 1}, {id: 2}, {id: 3}];
      const {value} = compose(query, list, {secret: 'foo'});
      const {value: payloadNext} = decompose(value.next, 'foo');
      expect(payloadNext).toEqual({
        cursors: [3],
        type: 'next',
        ...query
      });
    });
  });
});
