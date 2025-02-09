const db = require('../db');

/**
 * Execute database operations within a transaction
 * @param {Function} callback - Function containing the database operations
 * @returns {Promise} - Resolves with the result of the callback
 */
const withTransaction = async (callback) => {
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

module.exports = {
  withTransaction
};
