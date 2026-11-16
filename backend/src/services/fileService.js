'use strict';
const fs = require('fs');
const path = require('path');
const config = require('../config');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');

const STORAGE_ROOT = config.storageRoot;
const DOCS_DIR = path.join(STORAGE_ROOT, 'documents');

/**
 * Resolve a user-supplied document name — Path Traversal lab.
 */
function resolveDocument(name) {
  if (!name || typeof name !== 'string') throw new AppError(400, 'file parametri talab qilinadi');

  if (labs.isVulnerable('path-traversal')) {
    // VULNERABLE: "../" sequences are not neutralised, so the path can climb out of documents/.
    const target = path.join(DOCS_DIR, name);
    // LAB SAFETY SANDBOX: even in vulnerable mode reads are confined to backend/storage,
    // so students can reach storage/private/* but never real files on the host machine.
    if (!target.startsWith(STORAGE_ROOT + path.sep)) {
      throw new AppError(403, 'Lab sandbox: storage/ papkasidan tashqariga chiqish bloklangan');
    }
    return target;
  }

  // SECURE: strict allow-list pattern, basename only, canonical path must stay inside DOCS_DIR.
  if (path.basename(name) !== name || !/^[a-z0-9][a-z0-9-]*\.(txt|pdf|md)$/i.test(name)) {
    throw new AppError(400, 'Fayl nomi yaroqsiz');
  }
  const target = path.resolve(DOCS_DIR, name);
  if (!target.startsWith(DOCS_DIR + path.sep)) throw new AppError(400, 'Fayl nomi yaroqsiz');
  return target;
}

async function readDocument(name) {
  const target = resolveDocument(name);
  try {
    const stat = await fs.promises.stat(target);
    if (!stat.isFile()) throw new Error('not a file');
    return { path: target, filename: path.basename(target), content: await fs.promises.readFile(target) };
  } catch (_) {
    throw new AppError(404, 'Fayl topilmadi');
  }
}

async function listDocuments() {
  const files = await fs.promises.readdir(DOCS_DIR);
  return files.filter((f) => !f.startsWith('.'));
}

module.exports = { resolveDocument, readDocument, listDocuments, DOCS_DIR, STORAGE_ROOT };
