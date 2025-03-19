/**
 * Script to generate a secure random string for JWT_SECRET
 * Run with: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a secure random string (64 characters hex)
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\n=== JWT Secret Generator ===');
console.log('\nAdd this to your .env file:');
console.log('\nJWT_SECRET=' + jwtSecret);
console.log('\n===========================\n');
