'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config');
const localOnly = require('./middleware/localOnly');
const { classroomGate } = require('./middleware/classroomGate');
const { securityHeaders, dynamicCors } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

function createApp() {
  const app = express();
  app.disable('x-powered-by'); // re-added only by the Misconfiguration lab in vulnerable mode
  // Hosted: exactly one trusted reverse proxy (Render). Local: nginx inside Docker.
  app.set('trust proxy', config.hosted ? 1 : 'loopback, uniquelocal');

  // Platform health check — no data, no gate.
  app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

  app.use(localOnly); // SAFETY: localhost only (local) / known domains only (hosted)
  app.use(cookieParser());
  app.use(classroomGate); // SAFETY (hosted only): class access code required for everything
  app.use(securityHeaders);
  app.use(dynamicCors);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use('/api', apiLimiter, routes);

  // Single-service deployment: serve the built React app when present (Render image).
  const indexHtml = path.join(config.frontendDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(config.frontendDist, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(indexHtml));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
