'use strict';
const crypto = require('crypto');
const config = require('../config');
const labs = require('../labs/labState');

function notFound(req, res) {
  res.status(404).json({ error: 'Endpoint topilmadi' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  if (err.name === 'SequelizeUniqueConstraintError') status = 409;
  if (err.name === 'SequelizeValidationError') status = 400;
  if (err.type === 'entity.parse.failed') status = 400;

  if (labs.isVulnerable('misconfig')) {
    // VULNERABLE: verbose errors leak stack traces, SQL, file paths and framework internals.
    return res.status(status).json({
      error: err.message,
      details: err.details,
      name: err.name,
      sql: err.sql || (err.parent && err.parent.sql),
      stack: err.stack,
      node: process.version,
      cwd: process.cwd(),
    });
  }

  // SECURE: generic message for unexpected errors, correlation id for the server log.
  const requestId = crypto.randomUUID();
  if (status >= 500 && !config.isTest) console.error(`[${requestId}]`, err);
  const exposed = status < 500 && (err.expose || status === 409 || status === 400);
  const message = status === 409 ? 'Bunday yozuv allaqachon mavjud' : exposed ? err.message : 'Ichki server xatosi';
  return res.status(status).json({ error: message, details: exposed ? err.details : undefined, requestId });
}

module.exports = { notFound, errorHandler };
