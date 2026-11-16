'use strict';
const config = require('../config');
const labs = require('../labs/labState');
const FLAGS = require('../labs/flags');
const fileService = require('../services/fileService');
const AppError = require('../utils/AppError');

function health(req, res) {
  res.json({
    status: 'ok', app: 'VulnShop', mode: config.appMode, deployment: config.hosted ? 'hosted' : 'local',
    labs: labs.snapshot(), time: new Date().toISOString(),
  });
}

/**
 * Security Misconfiguration lab: a forgotten debug endpoint.
 * VULNERABLE: dumps runtime configuration and secrets. SECURE: does not exist (404).
 */
function debugConfig(req, res) {
  if (!labs.isVulnerable('misconfig')) throw new AppError(404, 'Endpoint topilmadi');
  res.json({
    warning: 'DEBUG ENDPOINT — remove before deploy',
    node: process.version,
    platform: process.platform,
    nodeEnv: config.nodeEnv,
    database: { ...config.db },
    jwt: { weakSecret: config.jwt.weakSecret, issuer: config.jwt.issuer },
    cors: 'reflect-any-origin',
    internalFlag: FLAGS.misconfig,
  });
}

async function listDocuments(req, res) {
  res.json({ files: await fileService.listDocuments() });
}

/** Path Traversal lab: document download. */
async function downloadDocument(req, res) {
  const doc = await fileService.readDocument(req.query.file);
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename.replace(/"/g, '')}"`);
  res.type('text/plain').send(doc.content);
}

module.exports = { health, debugConfig, listDocuments, downloadDocument };
