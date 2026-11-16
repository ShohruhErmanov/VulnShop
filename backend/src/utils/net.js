'use strict';
const net = require('net');

function normalize(ip = '') {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

/** True for loopback and RFC1918 / unique-local addresses (Docker bridge networks). */
function isLocalAddress(raw) {
  const ip = normalize(raw || '');
  if (ip === '::1' || ip.startsWith('127.')) return true;
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return /^f[cd][0-9a-f]{2}:/i.test(ip);
}

function hostnameOf(hostHeader = '') {
  if (hostHeader.startsWith('[')) return hostHeader.slice(1, hostHeader.indexOf(']'));
  return hostHeader.split(':')[0].toLowerCase();
}

module.exports = { isLocalAddress, hostnameOf };
