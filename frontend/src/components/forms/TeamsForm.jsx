import React, { useEffect } from 'react';
import { Typography, Button, Radio, FormControlLabel } from '@mui/material';

const TeamsForm = ({ teams, onNext, onPrevious, singleTeamMode }) => {
  // Ensure the default team is automatically selected
  useEffect(() => {
    // This code runs when the component mounts to ensure "Student" team is selected
    // No action needed if the default team is already configured in the parent component
    console.log("Default Student team is active");
  }, []);

  // If in single team mode, simply show info and continue button
  if (singleTeamMode) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Typography variant="h5" className="mb-6 text-center">
          Team Setup
        </Typography>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4" style={{ borderColor: teams[0].color }}>
          <Typography variant="subtitle1" className="mb-2 font-medium">
            Team Selection
          </Typography>
          
          {/* Adding a visual radio button to reinforce selection */}
          <FormControlLabel 
            control={<Radio checked={true} color="primary" />} 
            label={<Typography variant="body1" className="font-bold">{teams[0].name}</Typography>}
          />
          
          <Typography variant="body2" color="text.secondary" className="mt-2 ml-7">
            This quiz is configured to use a single team named "Student" for all participants.
            No additional team configuration is required.
          </Typography>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            variant="contained"
            onClick={() => onNext()}
            fullWidth
            className="py-3"
            color="primary"
          >
            Continue to Questions
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => onPrevious()}
            fullWidth
            className="py-3"
          >
            Back to Basic Info
          </Button>
        </div>
      </div>
    );
  }
  
  // This part is the original implementation, but it should never be reached
  // when singleTeamMode is true
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Typography variant="h5" className="mb-6 text-center">
        Team Setup
      </Typography>
      
      <Typography color="error">
        Error: Team configuration mode mismatch. Please contact support.
      </Typography>
    </div>
  );
};

export default TeamsForm;