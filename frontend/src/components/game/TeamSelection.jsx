import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Radio,
  FormControlLabel
} from '@mui/material';

const TeamSelection = ({ teams, selectedTeam, onTeamSelect, onConfirm, singleTeamMode = false }) => {
  // Auto-select the first team if in single team mode
  useEffect(() => {
    if (singleTeamMode && teams.length > 0 && !selectedTeam) {
      onTeamSelect(teams[0].id);
    }
  }, [singleTeamMode, teams, selectedTeam, onTeamSelect]);

  // If in single team mode, show simplified UI
  if (singleTeamMode && teams.length > 0) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Typography variant="h5" className="mb-6 text-center">
          Your Team
        </Typography>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4" style={{ borderColor: teams[0].color }}>
          <Typography variant="subtitle1" className="mb-2 font-medium">
            Team Assignment
          </Typography>
          
          <FormControlLabel 
            control={<Radio checked={true} color="primary" />} 
            label={<Typography variant="body1" className="font-bold">{teams[0].name}</Typography>}
          />
          
          <Typography variant="body2" color="text.secondary" className="mt-2 ml-7">
            This quiz is configured to use a single team for all participants.
          </Typography>
        </div>

        <Button
          variant="contained"
          fullWidth
          onClick={onConfirm}
          className="py-3"
        >
          Continue
        </Button>
      </div>
    );
  }

  // Original UI for multi-team mode
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
              {team.name}
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
