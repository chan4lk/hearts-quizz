import React from 'react';
import { Button, TextField, MenuItem } from '@mui/material';

const QuizBasicForm = ({ quiz, onInputChange, onNext }) => {
  const categories = [
    { value: 'general', label: 'General Knowledge' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' }
  ];

  const isFormValid = quiz.title && quiz.description && quiz.category;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <TextField
        fullWidth
        label="Quiz Title"
        value={quiz.title}
        onChange={(e) => onInputChange('title', e.target.value)}
        placeholder="Enter quiz title"
        variant="outlined"
      />

      <TextField
        fullWidth
        label="Description"
        value={quiz.description}
        onChange={(e) => onInputChange('description', e.target.value)}
        placeholder="Enter quiz description"
        multiline
        rows={3}
        variant="outlined"
      />

      <TextField
        fullWidth
        select
        label="Category"
        value={quiz.category}
        onChange={(e) => onInputChange('category', e.target.value)}
        variant="outlined"
      >
        <MenuItem value="">
          <em>Select a category</em>
        </MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.value} value={category.value}>
            {category.label}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="contained"
        fullWidth
        onClick={onNext}
        disabled={!isFormValid}
        className="mt-6"
      >
        Continue to Teams
      </Button>

      {!isFormValid && (
        <p className="text-red-500 text-sm text-center mt-2">
          Please fill in all fields to continue
        </p>
      )}
    </div>
  );
};

export default QuizBasicForm;
