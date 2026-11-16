// Runs before every test file: isolated in-memory SQLite database, lab mode.
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
if (!process.env.APP_MODE) process.env.APP_MODE = 'lab';
