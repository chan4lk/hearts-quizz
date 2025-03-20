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
  Popover,
  Fade,
  Tooltip,
  Snackbar,
  Paper,
  Divider,
  useTheme,
  alpha,
  Zoom,
  Badge
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import PaletteIcon from '@mui/icons-material/Palette';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import StyleIcon from '@mui/icons-material/Style';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const TeamsForm = ({ teams, onTeamsChange, onNext, onPrevious }) => {
  const theme = useTheme();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [error, setError] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: '', color: '#4B9CD3' });
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const predefinedColors = [
    '#3498db', // Bright Blue
    '#e74c3c', // Bright Red
    '#2ecc71', // Emerald Green
    '#f39c12', // Orange
    '#9b59b6', // Amethyst Purple
    '#1abc9c', // Turquoise
    '#e67e22', // Carrot Orange
    '#d35400', // Pumpkin
    '#16a085', // Green Sea
    '#c0392b', // Pomegranate
    '#8e44ad', // Wisteria
    '#27ae60', // Nephritis
    '#f1c40f', // Sunflower Yellow
    '#7f8c8d', // Asbestos Gray
    '#2c3e50'  // Midnight Blue
  ];

  const handleAddTeam = () => {
    if (!newTeam.name.trim()) {
      setError('Team name is required');
      return;
    }

    const newTeamWithId = {
      ...newTeam,
      id: Date.now(),
      name: newTeam.name.trim()
    };

    const updatedTeams = [...teams, newTeamWithId];
    onTeamsChange(updatedTeams);
    setNewTeam({ name: '', color: '#3498db' });
    setShowAddDialog(false);
    setError('');
    setSnackbar({ open: true, message: 'Team added successfully' });
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
    setSnackbar({ open: true, message: 'Team updated successfully' });
  };

  const handleDeleteTeam = (teamId, teamName) => {
    onTeamsChange(teams.filter(team => team.id !== teamId));
    setSnackbar({ open: true, message: `Team "${teamName}" deleted` });
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Paper 
      elevation={3} 
      className="max-w-2xl mx-auto rounded-lg"
      sx={{
        p: { xs: 3, sm: 6 },
        borderRadius: 3,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Decorative corner element */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: { xs: 100, sm: 150 },
          height: { xs: 100, sm: 150 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.15)} 0%, transparent 70%)`,
          borderRadius: '0 0 0 100%',
          zIndex: 0
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <GroupsIcon 
            color="primary" 
            sx={{ 
              fontSize: { xs: 32, sm: 40 }, 
              mr: 2,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.7 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.7 }
              }
            }} 
          />
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Team Setup
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {error && (
          <Zoom in={!!error}>
            <Alert 
              severity="error" 
              className="mb-4" 
              onClose={() => setError('')}
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                mb: 3
              }}
            >
              {error}
            </Alert>
          </Zoom>
        )}

        <Box sx={{ mb: 5 }}>
          <Button
            variant="contained"
            startIcon={<GroupAddIcon />}
            onClick={() => setShowAddDialog(true)}
            fullWidth
            className="mb-4"
            sx={{
              py: 1.8,
              borderRadius: 2.5,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            Add New Team
          </Button>

          <List sx={{ mt: 4 }}>
            {teams.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6, 
                px: 3,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                border: '1px dashed',
                borderColor: alpha(theme.palette.text.secondary, 0.2)
              }}>
                <EmojiObjectsIcon sx={{ fontSize: 56, mb: 2, opacity: 0.6, color: theme.palette.info.main }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: theme.palette.text.secondary }}>
                  No teams yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: 'auto' }}>
                  Teams help you organize participants into groups. Create your first team to get started!
                </Typography>
              </Box>
            ) : (
              teams.map((team, index) => (
                <Zoom in={true} key={team.id} style={{ transitionDelay: `${index * 50}ms` }}>
                  <ListItem
                    sx={{
                      mb: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderLeft: 4,
                      borderLeftColor: team.color,
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, ${alpha(team.color, 0.12)} 0%, transparent 100%)`,
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      },
                      '&:hover': {
                        transform: 'translateX(2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        '&:before': {
                          opacity: 1
                        }
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        width: '100%',
                        pr: 12, // Space for buttons
                      }}
                    >
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <StyleIcon 
                            sx={{ 
                              fontSize: 14, 
                              backgroundColor: theme.palette.background.paper,
                              borderRadius: '50%',
                              p: 0.2,
                              color: team.color
                            }} 
                          />
                        }
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: team.color,
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 2px 8px ${alpha(team.color, 0.5)}`,
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              color: '#fff', 
                              fontWeight: 'bold',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                          >
                            {team.name.charAt(0).toUpperCase()}
                          </Typography>
                        </Box>
                      </Badge>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {team.name}
                          </Typography>
                        }
                      />
                    </Box>
                    <ListItemSecondaryAction>
                      <Tooltip title="Edit team" arrow>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEditClick(team)}
                          sx={{ 
                            mr: 1,
                            color: theme.palette.info.main,
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              transform: 'rotate(15deg)'
                            },
                            transition: 'transform 0.2s'
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete team" arrow>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${team.name}"?`)) {
                              handleDeleteTeam(team.id, team.name);
                            }
                          }}
                          sx={{ 
                            color: theme.palette.error.main,
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              transform: 'rotate(15deg)'
                            },
                            transition: 'transform 0.2s'
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Zoom>
              ))
            )}
          </List>
        </Box>

        {/* Add Team Dialog */}
        <Dialog 
          open={showAddDialog} 
          onClose={() => {
            setShowAddDialog(false);
            setNewTeam({ name: '', color: '#3498db' });
            setError('');
          }}
          TransitionComponent={Fade}
          transitionDuration={300}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            elevation: 8,
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AddIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
              <Typography variant="h6">Add New Team</Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Team Name"
              fullWidth
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              error={!!error}
              helperText={error}
              sx={{ mt: 1 }}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <ColorLensIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.info.main }} />
                Team Color
              </Typography>
              <Button
                onClick={(e) => handleColorClick(e)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  width: '100%',
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  color: 'text.primary',
                  py: 1.5,
                  px: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(newTeam.color, 0.05)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: newTeam.color,
                      mr: 2,
                      boxShadow: `0 2px 8px ${alpha(newTeam.color, 0.5)}`,
                    }}
                  />
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    flexGrow: 1
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Selected Color</Typography>
                    <Box sx={{ 
                      mt: 0.5, 
                      display: 'flex', 
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      background: `linear-gradient(to right, ${newTeam.color} 0%, ${alpha(newTeam.color, 0.3)} 100%)`,
                    }} />
                  </Box>
                </Box>
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2.5 }}>
            <Button 
              onClick={() => {
                setShowAddDialog(false);
                setNewTeam({ name: '', color: '#3498db' });
                setError('');
              }}
              variant="outlined"
              startIcon={<CloseIcon />}
              sx={{ borderRadius: 1.5 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTeam} 
              variant="contained"
              disabled={!newTeam.name.trim()}
              startIcon={<CheckCircleIcon />}
              sx={{ 
                borderRadius: 1.5,
                ml: 1,
                '&:not(:disabled)': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              Add Team
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog 
          open={showEditDialog} 
          onClose={() => {
            setShowEditDialog(false);
            setError('');
          }}
          TransitionComponent={Fade}
          transitionDuration={300}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            elevation: 8,
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EditIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
              <Typography variant="h6">Edit Team</Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Team Name"
              fullWidth
              value={editingTeam?.name || ''}
              onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
              error={!!error}
              helperText={error}
              sx={{ mt: 1 }}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <ColorLensIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.info.main }} />
                Team Color
              </Typography>
              <Button
                onClick={(e) => handleColorClick(e, true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  width: '100%',
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  color: 'text.primary',
                  py: 1.5,
                  px: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(editingTeam?.color || '#3498db', 0.05)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: editingTeam?.color,
                      mr: 2,
                      boxShadow: `0 2px 8px ${alpha(editingTeam?.color || '#3498db', 0.5)}`,
                    }}
                  />
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    flexGrow: 1
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Selected Color</Typography>
                    <Box sx={{ 
                      mt: 0.5, 
                      display: 'flex', 
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      background: `linear-gradient(to right, ${editingTeam?.color} 0%, ${alpha(editingTeam?.color || '#3498db', 0.3)} 100%)`,
                    }} />
                  </Box>
                </Box>
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2.5 }}>
            <Button 
              onClick={() => {
                setShowEditDialog(false);
                setError('');
              }}
              variant="outlined"
              startIcon={<CloseIcon />}
              sx={{ borderRadius: 1.5 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditTeam}
              variant="contained"
              disabled={!editingTeam?.name?.trim()}
              startIcon={<CheckCircleIcon />}
              sx={{ 
                borderRadius: 1.5,
                ml: 1,
                '&:not(:disabled)': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Color Picker Popover */}
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
          sx={{ mt: 1 }}
          PaperProps={{
            elevation: 6,
            sx: { 
              borderRadius: 2,
              overflow: 'hidden'
            }
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
              <PaletteIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.info.main }} />
              Select Color
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: 1.5,
              mt: 1.5
            }}>
              {predefinedColors.map((color) => (
                <Tooltip key={color} title="" arrow>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: color,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      border: '2px solid',
                      borderColor: 'transparent',
                      boxShadow: `0 2px 8px ${alpha(color, 0.4)}`,
                      '&:hover': {
                        transform: 'scale(1.15) rotate(5deg)',
                        boxShadow: `0 4px 12px ${alpha(color, 0.6)}`,
                      },
                      ...(isEditingColor 
                        ? editingTeam?.color === color 
                        : newTeam.color === color) && {
                        borderColor: theme.palette.common.white,
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}, 0 4px 12px ${alpha(color, 0.6)}`,
                      }
                    }}
                    onClick={() => handleColorSelect(color)}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        </Popover>

        <Divider sx={{ mt: 2, mb: 4 }} />

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            onClick={onNext}
            fullWidth
            disabled={teams.length === 0}
            endIcon={<ArrowForwardIcon />}
            sx={{
              py: 1.8,
              borderRadius: 2.5,
              background: teams.length > 0 
                ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                : theme.palette.action.disabledBackground,
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: teams.length > 0 ? '0 4px 10px rgba(0, 0, 0, 0.15)' : 'none',
              '&:hover': teams.length > 0 ? {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
              } : {},
              '&:disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled
              }
            }}
          >
            Continue to Questions
          </Button>
          
          <Button
            variant="outlined"
            onClick={onPrevious}
            fullWidth
            startIcon={<ArrowBackIcon />}
            sx={{
              py: 1.8,
              borderRadius: 2.5,
              transition: 'all 0.2s',
              borderWidth: '1px',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderWidth: '1px'
              }
            }}
          >
            Back to Basic Info
          </Button>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: 2 }}
        />
      </Box>
    </Paper>
  );
};

export default TeamsForm;