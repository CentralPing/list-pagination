const express = require('express');
const request = require('supertest');

const {tokenize, validate} = require('./middleware');

const app = express();
const tokenRegExp = /^.+[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+\.$/;

describe('[Unit] `middleware`', () => {
  beforeAll(() => {
    const middlewareTokenize = tokenize();
    const middlewareValidate = validate();

    app.use(middlewareValidate);
    app.use((req, {locals}, next) => {
      // Simulate list
      if (!locals.query.count) {
        locals.list = [{id: 1}, {id: 2}, {id: 3}];
      }

      next();
    });
    app.use(middlewareTokenize);

    app.use((req, res, next) => {
      res.status(200).json(res.locals);
      next();
    });
    app.use((error, req, res, next) => {
      res.status(200).json(error.output.payload);
      next();
    });
  });

  describe('with requests', () => {
    it('should not compose tokens if request is a count', () => {
      return request(app).get('/')
        .query({count: 1})
        .then(({body}) => {
          expect(body).toEqual({
            query: {count: true}
          });
        });
    });

    it('should compose tokens with initial request', () => {
      return request(app).get('/')
        .query({
          limit: 3,
          sort: 'foo',
          filter: {foo: 'bar'}
        })
        .then(({body}) => {
          expect(body).toEqual({
            list: expect.any(Array),
            query: {
              limit: 3,
              sort: ['foo', 'id'],
              filter: {foo: 'bar'}
            },
            pagination: {
              self: expect.stringMatching(tokenRegExp),
              first: expect.stringMatching(tokenRegExp),
              next: expect.stringMatching(tokenRegExp)
            }
          });
        });
    });

    it('should compose tokens with page (next) request', () => {
      return request(app).get('/')
        .query({
          limit: 3,
          sort: 'foo',
          filter: {foo: 'bar'}
        })
        .then(({body: {pagination: {next}}}) =>
          request(app).get('/')
            .query({
              page: next
            }))
        .then(({body}) => {
          expect(body).toEqual({
            list: expect.any(Array),
            query: {
              limit: 3,
              sort: ['foo', 'id'],
              filter: {foo: 'bar'},
              cursors: [3],
              type: 'next'
            },
            pagination: {
              self: expect.stringMatching(tokenRegExp),
              first: expect.stringMatching(tokenRegExp),
              next: expect.stringMatching(tokenRegExp),
              prev: expect.stringMatching(tokenRegExp)
            }
          });
        });
    });

    it('should compose tokens with page (prev) request', () => {
      return request(app).get('/')
        .query({
          limit: 3,
          sort: 'foo',
          filter: {foo: 'bar'}
        })
        .then(({body: {pagination: {next}}}) =>
          request(app).get('/')
            .query({
              page: next
            }))
        .then(({body: {pagination: {prev}}}) =>
          request(app).get('/')
            .query({
              page: prev
            }))
        .then(({body}) => {
          expect(body).toEqual({
            list: expect.any(Array),
            query: {
              limit: 3,
              sort: ['foo', 'id'],
              filter: {foo: 'bar'},
              cursors: [3],
              type: 'prev'
            },
            pagination: {
              self: expect.stringMatching(tokenRegExp),
              first: expect.stringMatching(tokenRegExp),
              next: expect.stringMatching(tokenRegExp)
            }
          });
        });
    });
  });
});
