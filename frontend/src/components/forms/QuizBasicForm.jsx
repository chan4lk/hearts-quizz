import React from 'react';
import { TextField, Button, Typography, MenuItem } from '@mui/material';

const CATEGORIES = [
  'General Knowledge',
  'Science',
  'History',
  'Geography',
  'Sports',
  'Entertainment',
  'Technology',
  'Art & Literature',
  'Mathematics',
  'Music'
];

const QuizBasicForm = ({ quiz, onInputChange, onNext }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onInputChange(name, value);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Typography variant="h5" className="mb-6 text-center">
        Basic Information
      </Typography>
      
      <div className="space-y-6">
        <TextField
          label="Quiz Title"
          name="title"
          value={quiz.title}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          required
          helperText="Give your quiz a catchy title"
        />
        
        <TextField
          label="Description"
          name="description"
          value={quiz.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          required
          helperText="Provide a brief description of your quiz"
        />
        
        <TextField
          select
          label="Category"
          name="category"
          value={quiz.category}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          required
          helperText="Select a category for your quiz"
        >
          {CATEGORIES.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </TextField>
        
        <div className="mt-8">
          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            fullWidth
            className="py-3"
            disabled={!quiz.title || !quiz.description || !quiz.category}
          >
            Next: Team Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizBasicForm;
