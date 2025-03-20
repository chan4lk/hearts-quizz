import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';

const TeamSelection = ({ teams, selectedTeam, onTeamSelect, onConfirm }) => {
  if (teams.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Alert severity="error">
          No teams available. Please contact the quiz host.
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Typography variant="h5" className="mb-6 text-center">
        Select Your Team
      </Typography>
      
      <FormControl fullWidth className="mb-6">
        <InputLabel id="team-select-label">Team</InputLabel>
        <Select
          labelId="team-select-label"
          id="team-select"
          value={selectedTeam || ''}
          label="Team"
          onChange={(e) => onTeamSelect(e.target.value)}
        >
          {teams.map((team) => (
            <MenuItem
              key={team.id}
              value={team.id}
              sx={{
                borderLeft: 4,
                borderColor: team.color,
                '&:hover': {
                  backgroundColor: `${team.color}22`
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: team.color
                  }}
                />
                {team.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        fullWidth
        disabled={!selectedTeam}
        onClick={onConfirm}
        className="py-3"
      >
        Join Team
      </Button>

      {!selectedTeam && (
        <Typography variant="caption" color="error" className="mt-2 text-center block">
          Please select a team to continue
        </Typography>
      )}
    </div>
  );
};

export default TeamSelection;
