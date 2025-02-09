import React, { useState } from 'react';
import { TextField, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const QuestionForm = ({ question, onQuestionChange, onRemove, isLast }) => {
  const [imagePreview, setImagePreview] = useState(question.imageUrl || '/quiz.jpeg');

  const handleFieldChange = (field, value) => {
    onQuestionChange(field, value);
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    handleFieldChange('options', newOptions);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        handleFieldChange('imageUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Question</h3>
        {!isLast && (
          <IconButton
            onClick={onRemove}
            color="error"
            aria-label="delete question"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </div>
      
      <div className="space-y-6">
        <TextField
          fullWidth
          label="Question Text"
          value={question.text}
          onChange={(e) => handleFieldChange('text', e.target.value)}
          placeholder="Enter your question"
          variant="outlined"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Image
          </label>
          <div className="flex items-start space-x-4">
            <img
              src={imagePreview}
              alt="Question"
              className="w-32 h-32 object-cover rounded border"
              onError={(e) => {
                e.target.src = '/quiz.jpeg';
                setImagePreview('/quiz.jpeg');
              }}
            />
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload an image for this question (optional)
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <TextField
            type="number"
            label="Time Limit (seconds)"
            value={question.timeLimit}
            onChange={(e) => handleFieldChange('timeLimit', parseInt(e.target.value, 10))}
            inputProps={{ min: 5, max: 60 }}
            variant="outlined"
          />

          <TextField
            type="number"
            label="Points"
            value={question.points}
            onChange={(e) => handleFieldChange('points', parseInt(e.target.value, 10))}
            inputProps={{ min: 100, max: 2000, step: 100 }}
            variant="outlined"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Answer Options
          </label>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center space-x-2">
              <TextField
                fullWidth
                value={option}
                onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                placeholder={`Option ${optionIndex + 1}`}
                variant="outlined"
              />
              <Button
                variant={question.correctAnswer === optionIndex ? "contained" : "outlined"}
                onClick={() => handleFieldChange('correctAnswer', optionIndex)}
                color="primary"
              >
                Correct
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
