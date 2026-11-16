'use strict';
const { Sequelize } = require('sequelize');
const config = require('./index');

const common = { logging: false, define: { underscored: false, freezeTableName: true } };

const sequelize = config.db.dialect === 'sqlite'
  ? new Sequelize({ dialect: 'sqlite', storage: config.db.storage, ...common })
  : new Sequelize(config.db.name, config.db.user, config.db.password, {
      host: config.db.host,
      port: config.db.port,
      dialect: 'mysql',
      pool: { max: 10, min: 0, idle: 10000 },
      ...common,
    });

async function connectWithRetry(retries = 20, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`[db] connection failed (${err.message}); retry ${attempt}/${retries}...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

module.exports = { sequelize, connectWithRetry };
