const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');

// Get teams for a quiz
router.get('/quiz/:quizId/teams', async (req, res) => {
  try {
    const teams = await Team.getQuizTeams(req.params.quizId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team scores for a quiz
router.get('/quiz/:quizId/scores', async (req, res) => {
  try {
    const teamScores = await Team.getTeamScores(req.params.quizId);
    const playerScores = await Player.getPlayerScores(req.params.quizId);
    
    res.json({
      teamScores,
      playerScores
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Assign player to team
router.post('/player/:playerId/team/:teamId', async (req, res) => {
  try {
    await Team.assignPlayerToTeam(req.params.playerId, req.params.teamId);
    res.json({ message: 'Player assigned to team successfully' });
  } catch (error) {
    console.error('Error assigning player to team:', error);
    res.status(500).json({ error: 'Failed to assign player to team' });
  }
});

module.exports = router;
