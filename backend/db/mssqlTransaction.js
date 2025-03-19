const mssql = require('./mssql');

/**
 * Execute database operations within a transaction for MSSQL
 * @param {Function} callback - Function containing the database operations
 * @returns {Promise} - Resolves with the result of the callback
 */
const withTransaction = async (callback) => {
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
