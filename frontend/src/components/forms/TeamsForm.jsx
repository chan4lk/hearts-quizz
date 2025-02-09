import React from 'react';
import { Box, Button, TextField, IconButton, Typography, List, ListItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const TeamsForm = ({ teams, onTeamAdd, onTeamRemove, onTeamNameChange, onNext }) => {
  const handleAddTeam = () => {
    onTeamAdd({
      id: Date.now(),
      name: `Team ${teams.length + 1}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Typography variant="h5" className="mb-6 text-center">
        Team Setup
      </Typography>
      
      <List className="space-y-4">
        {teams.map((team, index) => (
          <ListItem
            key={team.id}
            className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
            sx={{
              borderLeft: 4,
              borderColor: team.color
            }}
          >
            <TextField
              fullWidth
              label={`Team ${index + 1} Name`}
              value={team.name}
              onChange={(e) => onTeamNameChange(team.id, e.target.value)}
              size="small"
              className="flex-1"
            />
            <IconButton
              onClick={() => onTeamRemove(team.id)}
              disabled={teams.length <= 2}
              color="error"
              className="flex-shrink-0"
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>

      <div className="mt-6 space-y-4">
        <Button
          variant="outlined"
          onClick={handleAddTeam}
          fullWidth
          className="py-3"
        >
          Add Team
        </Button>

        <Button
          variant="contained"
          onClick={onNext}
          fullWidth
          disabled={teams.length < 2}
          className="py-3"
        >
          Continue to Questions
        </Button>
      </div>

      {teams.length < 2 && (
        <Typography variant="caption" color="error" className="mt-2 text-center block">
          Please add at least 2 teams to continue
        </Typography>
      )}
    </div>
  );
};

export default TeamsForm;
