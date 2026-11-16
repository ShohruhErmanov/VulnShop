'use strict';
const labService = require('../services/labService');
const tokenService = require('../services/tokenService');
const { setAuthCookie } = require('./authController');

module.exports = {
  list: async (req, res) => res.json({ labs: await labService.list(req.user.id) }),
  dashboard: async (req, res) => res.json(await labService.dashboard(req.user.id)),
  detail: async (req, res) => res.json({ lab: await labService.detail(req.user.id, req.params.id) }),
  setMode: async (req, res) => {
    const result = await labService.setMode(req.params.id, req.body.vulnerable);
    // Switching the auth lab changes the token format -> hand out a fresh token so the student stays logged in.
    let token;
    if (req.params.id === 'broken-auth') {
      token = tokenService.sign(req.user);
      setAuthCookie(res, token);
    }
    res.json({ ...result, token });
  },
  setAll: async (req, res) => {
    const modes = await labService.setAll(req.body.vulnerable);
    const token = tokenService.sign(req.user);
    setAuthCookie(res, token);
    res.json({ modes, token });
  },
  submitFlag: async (req, res) => res.json(await labService.submitFlag(req.user.id, req.params.id, req.body.flag)),
  verify: async (req, res) => res.json(await labService.verifyFix(req.user.id, req.params.id)),
  quiz: async (req, res) => res.json(await labService.gradeQuiz(req.user.id, req.params.id, req.body.answers)),
  resetProgress: async (req, res) => {
    await labService.resetProgress(req.user.id);
    res.json({ ok: true });
  },
  students: async (req, res) => res.json({ students: await labService.allStudents() }),
};
