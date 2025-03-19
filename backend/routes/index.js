/**
 * API Routes Index
 * Centralizes all API routes and handles versioning
 */

const express = require('express');
const { router: authRouter } = require('./authRoutes');
const quizRoutes = require('./quizRoutes');

// Create versioned routers
const v1Router = express.Router();

// Mount routes on v1 router
v1Router.use('/auth', authRouter);
v1Router.use('/quizzes', quizRoutes);

// Export router factory function
module.exports = function createApiRouter() {
  const apiRouter = express.Router();
  
  // Mount versioned routers
  apiRouter.use('/v1', v1Router);
  
  // Redirect base API requests to latest version
  apiRouter.get('/', (req, res) => {
    res.json({
      message: 'Hearts Quiz API',
      versions: ['/api/v1'],
      latest: '/api/v1',
      documentation: '/api/docs'
    });
  });
  
  return apiRouter;
};
