import React from 'react';
import { TextField, Button, Typography, MenuItem, InputAdornment } from '@mui/material';
import { Title, Description, Category, ArrowForward, Edit, Info, Quiz } from '@mui/icons-material';

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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-center mb-8">
        <Quiz className="text-blue-600 mr-2" fontSize="large" />
        <Typography variant="h4" className="font-bold text-gray-800">
          Create Your Quiz
        </Typography>
      </div>

      
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Title className="text-gray-500" />
              </InputAdornment>
            ),
          }}
          className="bg-white"
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Description className="text-gray-500" />
              </InputAdornment>
            ),
          }}
          className="bg-white"
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Category className="text-gray-500" />
              </InputAdornment>
            ),
          }}
          className="bg-white"
        >
          {CATEGORIES.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </TextField>

        <div className="mt-10">
          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            fullWidth
            className="py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
            disabled={!quiz.title || !quiz.description || !quiz.category}
            endIcon={<ArrowForward />}
            size="large"
          >
            Next: Team Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizBasicForm;