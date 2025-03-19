const db = require('../db');
const mssql = require('./mssql');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * Execute database operations within a transaction
 * @param {Function} callback - Function containing the database operations
 * @returns {Promise} - Resolves with the result of the callback
 */
const withTransaction = async (callback) => {
  // Determine database type from environment variable (default to sqlite)
  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'mssql') {
    return withMssqlTransaction(callback);
  } else {
    return withSqliteTransaction(callback);
  }
};

/**
 * Execute database operations within a SQLite transaction
 * @param {Function} callback - Function containing the database operations
 * @returns {Promise} - Resolves with the result of the callback
 */
const withSqliteTransaction = async (callback) => {
  try {
    await db.run('BEGIN TRANSACTION');
    const result = await callback();
    await db.run('COMMIT');
    return result;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
};

/**
 * Execute database operations within a MSSQL transaction
 * @param {Function} callback - Function containing the database operations
 * @returns {Promise} - Resolves with the result of the callback
 */
const withMssqlTransaction = async (callback) => {
  const transaction = await mssql.beginTransaction();
  try {
    const result = await callback();
    await mssql.commitTransaction(transaction);
    return result;
  } catch (error) {
    await mssql.rollbackTransaction(transaction);
    throw error;
  }
};

module.exports = {
  withTransaction
};
