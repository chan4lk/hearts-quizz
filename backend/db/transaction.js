/**
 * Transaction Utility
 * Provides a wrapper for executing database operations within a transaction
 */
const db = require('./index');

/**
 * Execute database operations within a transaction
 * @param {Function} callback - Function containing the database operations
 * @returns {Promise<any>} - Resolves with the result of the callback
 */
const withTransaction = async (callback) => {
  return db.transaction(callback);
};

module.exports = {
  withTransaction
};
