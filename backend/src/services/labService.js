'use strict';
const config = require('../config');
const { LabProgress, User } = require('../models');
const { LABS, LAB_IDS, getLab } = require('../labs/registry');
const labState = require('../labs/labState');
const FLAGS = require('../labs/flags');
const verifiers = require('../labs/verifiers');
const content = require('../labs/content');
const AppError = require('../utils/AppError');

const QUIZ_PASS_PERCENT = 70;

function ensureLab(id) {
  const lab = getLab(id);
  if (!lab) throw new AppError(404, 'Laboratoriya topilmadi');
  return lab;
}

async function progressMap(userId) {
  const rows = await LabProgress.findAll({ where: { userId } });
  return Object.fromEntries(rows.map((r) => [r.labId, r]));
}

function progressDto(row) {
  return {
    discovered: Boolean(row && row.discovered),
    fixed: Boolean(row && row.fixed),
    quizPassed: Boolean(row && row.quizPassed),
    quizScore: row ? row.quizScore : 0,
    discoveredAt: row ? row.discoveredAt : null,
    fixedAt: row ? row.fixedAt : null,
  };
}

async function list(userId) {
  const progress = await progressMap(userId);
  return LABS.map((lab) => ({ ...lab, vulnerable: labState.isVulnerable(lab.id), progress: progressDto(progress[lab.id]) }));
}

function summarize(labs) {
  const total = labs.length;
  const discovered = labs.filter((l) => l.progress.discovered).length;
  const fixed = labs.filter((l) => l.progress.fixed).length;
  const quizzes = labs.filter((l) => l.progress.quizPassed).length;
  const secured = labs.filter((l) => !l.vulnerable).length;
  const points = labs.reduce((s, l) => s + (l.progress.discovered ? l.points : 0) + (l.progress.fixed ? Math.round(l.points / 2) : 0), 0);
  const maxPoints = labs.reduce((s, l) => s + l.points + Math.round(l.points / 2), 0);
  return {
    total,
    discovered,
    fixed,
    quizzes,
    secured,
    vulnerable: total - secured,
    securityScore: Math.round((secured / total) * 100),
    completion: Math.round(((discovered + fixed + quizzes) / (total * 3)) * 100),
    points,
    maxPoints,
  };
}

async function dashboard(userId) {
  const labs = await list(userId);
  const owasp = {};
  for (const lab of labs) {
    owasp[lab.owasp] = owasp[lab.owasp] || { category: lab.owasp, labs: 0, discovered: 0, fixed: 0 };
    owasp[lab.owasp].labs += 1;
    if (lab.progress.discovered) owasp[lab.owasp].discovered += 1;
    if (lab.progress.fixed) owasp[lab.owasp].fixed += 1;
  }
  const activity = labs
    .flatMap((l) => [
      l.progress.discoveredAt && { labId: l.id, title: l.title, type: 'discovered', at: l.progress.discoveredAt },
      l.progress.fixedAt && { labId: l.id, title: l.title, type: 'fixed', at: l.progress.fixedAt },
    ])
    .filter(Boolean)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);
  return { appMode: config.appMode, summary: summarize(labs), owasp: Object.values(owasp), labs, activity };
}

async function detail(userId, id) {
  const lab = ensureLab(id);
  const progress = await progressMap(userId);
  const c = content[id];
  return {
    ...lab,
    vulnerable: labState.isVulnerable(id),
    progress: progressDto(progress[id]),
    content: { ...c, quiz: c.quiz.map(({ answer, ...q }) => q) }, // never send quiz answers
  };
}

async function upsertProgress(userId, labId, patch) {
  const [row] = await LabProgress.findOrCreate({ where: { userId, labId }, defaults: { userId, labId } });
  await row.update(patch);
  return row;
}

async function setMode(id, vulnerable) {
  ensureLab(id);
  if (!config.labEnabled) throw new AppError(403, 'Production rejimida laboratoriyalarni yoqib bo‘lmaydi');
  await labState.setMode(id, vulnerable);
  return { id, vulnerable: labState.isVulnerable(id) };
}

async function setAll(vulnerable) {
  if (!config.labEnabled) throw new AppError(403, 'Production rejimida laboratoriyalarni yoqib bo‘lmaydi');
  await labState.setAll(vulnerable);
  return labState.snapshot();
}

async function submitFlag(userId, id, flag) {
  ensureLab(id);
  const correct = String(flag || '').trim() === FLAGS[id];
  if (!correct) return { correct: false };
  const row = await upsertProgress(userId, id, { discovered: true, discoveredAt: new Date() });
  return { correct: true, progress: progressDto(row) };
}

async function verifyFix(userId, id) {
  ensureLab(id);
  const result = await verifiers[id]();
  const vulnerable = labState.isVulnerable(id);
  const fixed = result.blocked && !vulnerable;
  let progress;
  if (fixed) progress = progressDto(await upsertProgress(userId, id, { fixed: true, fixedAt: new Date() }));
  return { ...result, mode: vulnerable ? 'vulnerable' : 'secure', fixed, progress };
}

async function gradeQuiz(userId, id, answers) {
  ensureLab(id);
  const quiz = content[id].quiz;
  if (!Array.isArray(answers) || answers.length !== quiz.length) throw new AppError(400, `${quiz.length} ta javob yuboring`);
  const results = quiz.map((q, i) => ({ correct: Number(answers[i]) === q.answer, answer: q.answer, explanation: q.explanation }));
  const correct = results.filter((r) => r.correct).length;
  const score = Math.round((correct / quiz.length) * 100);
  const passed = score >= QUIZ_PASS_PERCENT;
  const existing = (await progressMap(userId))[id];
  const best = Math.max(score, existing ? existing.quizScore : 0);
  const row = await upsertProgress(userId, id, { quizScore: best, quizPassed: Boolean((existing && existing.quizPassed) || passed) });
  return { score, passed, correct, total: quiz.length, results, progress: progressDto(row) };
}

async function resetProgress(userId) {
  await LabProgress.destroy({ where: { userId } });
}

/** Instructor view: progress of every student. */
async function allStudents() {
  const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'], order: [['id', 'ASC']] });
  const rows = await LabProgress.findAll();
  return users.map((u) => {
    const mine = rows.filter((r) => r.userId === u.id);
    const pm = Object.fromEntries(mine.map((r) => [r.labId, progressDto(r)]));
    const labs = LABS.map((l) => ({ ...l, vulnerable: true, progress: pm[l.id] || progressDto(null) }));
    const s = summarize(labs);
    return {
      id: u.id, name: u.name, email: u.email, role: u.role,
      discovered: s.discovered, fixed: s.fixed, quizzes: s.quizzes, points: s.points, completion: s.completion,
      labs: Object.fromEntries(LAB_IDS.map((lid) => [lid, pm[lid] || progressDto(null)])),
    };
  });
}

module.exports = { list, dashboard, detail, setMode, setAll, submitFlag, verifyFix, gradeQuiz, resetProgress, allStudents, QUIZ_PASS_PERCENT };
