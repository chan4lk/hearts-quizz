import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  Box,
  Divider
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const TeamLeaderboard = ({ teams, players }) => {
  // Calculate team scores based on player scores
  const teamScores = teams.map(team => {
    const teamPlayers = players.filter(player => player.teamId === team.id);
    const totalScore = teamPlayers.reduce((sum, player) => sum + (player.score || 0), 0);
    const averageScore = teamPlayers.length > 0 ? totalScore / teamPlayers.length : 0;

    return {
      ...team,
      totalScore,
      averageScore,
      playerCount: teamPlayers.length
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="max-w-2xl mx-auto">
      <Paper elevation={2} className="overflow-hidden">
        <List className="divide-y">
          {teamScores.map((team, index) => (
            <ListItem
              key={team.id}
              className="p-4"
              sx={{
                backgroundColor: `${team.color}11`,
                '&:hover': {
                  backgroundColor: `${team.color}22`
                }
              }}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: team.color + '33' }}>
                  {index < 3 && (
                    <EmojiEventsIcon sx={{ 
                      color: team.color,
                      fontSize: index === 0 ? 32 : 28
                    }} />
                  )}
                  {index >= 3 && (
                    <Typography variant="h6" sx={{ color: team.color }}>
                      {index + 1}
                    </Typography>
                  )}
                </div>

                <div className="flex-1">
                  <Typography variant="h6" className="font-semibold" sx={{ color: team.color }}>
                    {team.name}
                  </Typography>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Score: {team.totalScore}</span>
                    <span>Avg: {team.averageScore.toFixed(1)}</span>
                    <span>Players: {team.playerCount}</span>
                  </div>
                </div>
              </div>
            </ListItem>
          ))}
        </List>
      </Paper>
    </div>
  );
};

export default TeamLeaderboard;
