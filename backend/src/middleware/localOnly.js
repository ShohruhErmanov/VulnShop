'use strict';
const config = require('../config');
const { isLocalAddress, hostnameOf } = require('../utils/net');

/**
 * SAFETY GUARD — the vulnerable lab must never be reachable by accident.
 * Local deployment (default): request must come from loopback / private (Docker) address AND carry a
 *   localhost-like Host header (defeats public exposure and DNS rebinding).
 * Hosted deployment: Host must be one of the configured PUBLIC_HOSTS; access is then enforced by the
 *   classroom access gate (see classroomGate.js).
 */
module.exports = function localOnly(req, res, next) {
  if (!config.labEnabled && !config.hosted) return next();
  const host = hostnameOf(req.headers.host || '');

  if (config.hosted) {
    if (config.publicHosts.includes(host)) return next();
    return res.status(403).json({ error: 'Noma’lum domen.' });
  }

  const hostOk = config.allowedHosts.includes(host) || host.endsWith('.localhost');
  if (!isLocalAddress(req.socket.remoteAddress) || !hostOk) {
    return res.status(403).json({
      error: 'VulnShop lab rejimida faqat localhost orqali ishlaydi. Tashqi so‘rov rad etildi.',
    });
  }
  return next();
};
