'use strict';
const config = require('../config');
const { LabSetting } = require('../models');
const { LAB_IDS } = require('./registry');

// In-memory cache of lab modes: labId -> true (vulnerable) | false (secure)
const modes = new Map();

async function init() {
  for (const labId of LAB_IDS) {
    const [row] = await LabSetting.findOrCreate({ where: { labId }, defaults: { vulnerable: true } });
    modes.set(labId, Boolean(row.vulnerable));
  }
}

/**
 * Central switch used by every vulnerable code path.
 * SAFETY: always returns false (secure) when the app is not in lab mode.
 */
function isVulnerable(labId) {
  if (!config.labEnabled) return false;
  if (!modes.has(labId)) return true;
  return modes.get(labId);
}

async function setMode(labId, vulnerable) {
  if (!config.labEnabled) throw new Error('Lab rejimi o‘chirilgan (production)');
  await LabSetting.upsert({ labId, vulnerable: Boolean(vulnerable) });
  modes.set(labId, Boolean(vulnerable));
}

async function setAll(vulnerable) {
  for (const labId of LAB_IDS) await setMode(labId, vulnerable);
}

function snapshot() {
  return Object.fromEntries(LAB_IDS.map((id) => [id, isVulnerable(id)]));
}

module.exports = { init, isVulnerable, setMode, setAll, snapshot };
