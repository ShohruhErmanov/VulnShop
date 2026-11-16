'use strict';
const AppError = require('../utils/AppError');

/** Joi validation middleware: validate(schema, 'body' | 'query' | 'params') */
module.exports = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source], { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    return next(new AppError(400, 'Validatsiya xatosi', error.details.map((d) => d.message)));
  }
  if (source === 'query') {
    // req.query is a getter in Express 5; assigning keys keeps compatibility.
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, value);
  } else {
    req[source] = value;
  }
  return next();
};
