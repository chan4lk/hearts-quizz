import React, { useState } from 'react';
import {
  Typography,
  Button,
  TextField,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  InputAdornment,
  Popover
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ColorLensIcon from '@mui/icons-material/ColorLens';

const TeamsForm = ({ teams, onTeamsChange, onNext, onPrevious }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [error, setError] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: '', color: '#4B9CD3' });
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [isEditingColor, setIsEditingColor] = useState(false);

  const predefinedColors = [
    '#4B9CD3', // Blue
    '#FF6B6B', // Red
    '#4CAF50', // Green
    '#FFC107', // Yellow
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63', // Pink
    '#795548', // Brown
    '#607D8B'  // Grey
  ];

  const handleAddTeam = () => {
    if (!newTeam.name.trim()) {
      setError('Team name is required');
      return;
    }

    // Create a new team with a unique ID
    const newTeamWithId = {
      ...newTeam,
      id: Date.now(), // Generate a unique ID
      name: newTeam.name.trim()
    };

    // Log the new team and current teams for debugging
    console.log('Adding new team:', newTeamWithId);
    console.log('Current teams:', teams);

    // Update teams array
    const updatedTeams = [...teams, newTeamWithId];
    console.log('Updated teams:', updatedTeams);

    // Call the parent's onTeamsChange function
    onTeamsChange(updatedTeams);

    // Reset form and close dialog
    setNewTeam({ name: '', color: '#4B9CD3' });
    setShowAddDialog(false);
    setError('');
  };

  const handleEditTeam = () => {
    if (!editingTeam.name.trim()) {
      setError('Team name is required');
      return;
    }
    onTeamsChange(teams.map(team => 
      team.id === editingTeam.id ? editingTeam : team
    ));
    setShowEditDialog(false);
    setEditingTeam(null);
    setError('');
  };

  const handleDeleteTeam = (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      onTeamsChange(teams.filter(team => team.id !== teamId));
    }
  };

  const handleEditClick = (team) => {
    setEditingTeam({ ...team });
    setShowEditDialog(true);
  };

  const handleColorClick = (event, isEditing = false) => {
    setColorAnchorEl(event.currentTarget);
    setIsEditingColor(isEditing);
  };

  const handleColorClose = () => {
    setColorAnchorEl(null);
  };

  const handleColorSelect = (color) => {
    if (isEditingColor) {
      setEditingTeam({ ...editingTeam, color });
    } else {
      setNewTeam({ ...newTeam, color });
    }
    handleColorClose();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Typography variant="h5" className="mb-6 text-center">
        Team Setup
      </Typography>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box className="mb-6">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
          fullWidth
          className="mb-4"
        >
          Add New Team
        </Button>

        <List>
          {teams.map((team) => (
            <ListItem
              key={team.id}
              className="mb-2 bg-white rounded-lg shadow-sm"
              sx={{
                borderLeft: 4,
                borderColor: team.color,
                '&:hover': {
                  backgroundColor: `${team.color}11`
                }
              }}
            >
              <ListItemText
                primary={team.name}
                secondary={`Color: ${team.color}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleEditClick(team)}
                  className="mr-2"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteTeam(team.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>

      <Dialog 
        open={showAddDialog} 
        onClose={() => {
          setShowAddDialog(false);
          setNewTeam({ name: '', color: '#4B9CD3' }); // Reset form when closing
        }}
      >
        <DialogTitle>Add New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            error={!!error}
            helperText={error}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Team Color
            </Typography>
            <Button
              startIcon={<ColorLensIcon sx={{ color: newTeam.color }} />}
              onClick={(e) => handleColorClick(e)}
              sx={{
                border: '1px solid #ddd',
                width: '100%',
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.primary'
              }}
            >
              {newTeam.color}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowAddDialog(false);
              setNewTeam({ name: '', color: '#4B9CD3' }); // Reset form when canceling
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddTeam} 
            variant="contained"
            disabled={!newTeam.name.trim()} // Disable button if name is empty
          >
            Add Team
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
        <DialogTitle>Edit Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={editingTeam?.name || ''}
            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Team Color
            </Typography>
            <Button
              startIcon={<ColorLensIcon sx={{ color: editingTeam?.color }} />}
              onClick={(e) => handleColorClick(e, true)}
              sx={{
                border: '1px solid #ddd',
                width: '100%',
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.primary'
              }}
            >
              {editingTeam?.color}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditTeam} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(colorAnchorEl)}
        anchorEl={colorAnchorEl}
        onClose={handleColorClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
          {predefinedColors.map((color) => (
            <Box
              key={color}
              sx={{
                width: 40,
                height: 40,
                backgroundColor: color,
                borderRadius: 1,
                cursor: 'pointer',
                border: '2px solid transparent',
                '&:hover': {
                  borderColor: 'primary.main',
                },
                ...(isEditingColor 
                  ? editingTeam?.color === color 
                  : newTeam.color === color) && {
                  borderColor: 'primary.main',
                }
              }}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </Box>
      </Popover>

      <div className="mt-6 space-y-3">
        <Button
          variant="contained"
          onClick={onNext}
          fullWidth
          className="py-3"
          color="primary"
          disabled={teams.length === 0}
        >
          Continue to Questions
        </Button>
        
        <Button
          variant="outlined"
          onClick={onPrevious}
          fullWidth
          className="py-3"
        >
          Back to Basic Info
        </Button>
      </div>
    </div>
  );
};

export default TeamsForm;