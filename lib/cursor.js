const {encode, decode} = require('./token');

exports.compose = compose;
exports.decompose = decompose;

/**
 * Composes pagination tokens comprised of paging parameters and cursors.
 * @param {Object} query
 * @param {Boolean} [query.count]
 * @param {Number} [query.limit]
 * @param {String|String[]} [query.sort]
 * @param {Object} [query.filter]
 * @param {String} [query.type]
 * @param {String[]|Number[]} [query.cursors]
 * @param {Object[]} [list=[]]
 * @param {Object} [options]
 * @param {String} [options.uuidKey=id]
 * @param {String} [options.secret] A string to sign the token.
 * @return {Object} {error, value: {first[, next][, prev]}}
 */
function compose(
  {
    limit,
    sort,
    filter,
    type,
    cursors: [...cursors] = []
  } = {},
  list = [],
  {
    uuidKey = 'id',
    secret
  } = {}
) {
  const retObj = {error: null, value: {}};
  const params = {limit, sort, filter};

  // Create `self` token
  {
    const {error, value} = encode({
      ...params,
      cursors,
      type: 'self'
    }, {secret});

    if (error !== null) return {error};

    retObj.value.self = value;
  }

  if (type === 'prev') cursors.shift();

  // Create `first` token
  {
    const {error, value} = encode({
      ...params,
      cursors: [],
      type: 'first'
    }, {secret});

    if (error !== null) return {error};

    retObj.value.first = value;
  }

  // Create `next` token
  if (list.length === limit) {
    const {error, value} = encode({
      ...params,
      cursors: [list[list.length - 1][uuidKey], ...cursors],
      type: 'next'
    }, {secret});

    if (error !== null) return {error};

    retObj.value.next = value;
  }

  // Create `prev` token
  if (cursors.length) {
    const {error, value} = encode({
      ...params,
      cursors,
      type: 'prev'
    }, {secret});

    if (error !== null) return {error};

    retObj.value.prev = value;
  }

  return retObj;
}

/**
 * Decomposes pagination token and returns the paging parameters and cursors.
 * @param {String} [token]
 * @param {String} [secret]
 * @return {Object} {error, value}
 */
function decompose(token, secret) {
  if (token === undefined) return {error: null, value: {}};

  return decode(token, secret);
}
