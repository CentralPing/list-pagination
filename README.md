# @CentralPing/list-pagination

[![Build Status](https://travis-ci.org/CentralPing/list-pagination.svg?branch=master)](https://travis-ci.org/CentralPing/list-pagination)
[![Coverage Status](https://coveralls.io/repos/github/CentralPing/list-pagination/badge.svg)](https://coveralls.io/github/CentralPing/list-pagination)
[![Dependency Status](https://david-dm.org/CentralPing/list-pagination.svg)](https://david-dm.org/CentralPing/list-pagination)
[![Greenkeeper Status](https://badges.greenkeeper.io/CentralPing/list-pagination.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/centralping/list-pagination/badge.svg)](https://snyk.io/test/github/centralping/list-pagination)

A slightly opinionated module for validating pagination parameters and generating pagination links.

## Installation

`npm i --save https://github.com/CentralPing/list-pagination`

## API Reference


## Examples

### For Validation With [Express](http://expressjs.com) Middleware

```js
const express = require('express');
const { tokenize, validate } = require('list-pagination');

const app = express();

app.get('/foos',
  validate,
  (req, res, next) => {
    res.locals.list = getList(res.locals.query);
    next();
  },
  tokenize,
  (req, res) => {
    res.json({
      pages: res.locals.pagination,
      list: res.locals.list
    })
  }
);

/*
GET request -> /foos
// After validate
res.locals would be set to:
  {
    query: {
      // Defaults
      limit: 25,
      sort: ['id'],
      filter: {}
    }
  }
// After tokenize (assuming a list of 25 items)
res.locals would include:
  {
    pagination: {
      self: TOKEN,
      first: TOKEN,
      next: TOKEN // Omitted if less than 25 items
    }
  }

GET request -> /foos?limit=5&sort=-foo&filter.foo='bar'
// After validate
res.locals would be set to:
  {
    query: {
      limit: 5,
      sort: ['-foo', 'id'],
      filter: {foo: 'bar'}
    }
  }
// After tokenize (assuming a list of 5 items)
res.locals would include:
  {
    pagination: {
      self: TOKEN,
      first: TOKEN,
      next: TOKEN
    }
  }

GET request -> /foos?page=NEXT_TOKEN
// After validate (assuming orignal limit, sort, and filter from previous example)
res.locals would be set to:
  {
    query: {
      limit: 5,
      sort: ['-foo', 'id'],
      filter: {foo: 'bar'},
      // Subsequent next tokens will add more cursors, e.g. [6, 3],
      //  where the current cursor will always be at the 0 index position
      cursors: [3],
      type: 'next'
    }
  }
// After tokenize (assuming another list of 5 items)
res.locals would include:
  {
    pagination: {
      self: TOKEN,
      first: TOKEN,
      next: TOKEN,
      prev: TOKEN
    }
  }
*/
```

### For Validation Without Middleware

```js
const express = require('express');
const { params } = require('list-pagination');

const app = express();

const { schema, compose } = require('list-pagination');

const validate = schema();

const app = express();

app.get('/foos',
  (req, res, next) => {
    const {error: validationError, value: params} = validate(req.query);

    if (validationError !== null) { return next(validationError); }

    const list = getList(params);

    const {error: composeError, value: pagination} = compose(params, list);

    if (composeError !== null) { return next(composeError); }

    res.json({
      pages: pagination,
      list
    });
  }
);
```

## License

MIT
