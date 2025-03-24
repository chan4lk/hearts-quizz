import React from 'react';
import { 
  TextField, 
  Button, 
  IconButton, 
  Tooltip, 
  Slider, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  EmojiEvents as PointsIcon,
  CheckCircle as CorrectIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const QuestionForm = ({ question, onQuestionChange, onRemove, isLast }) => {
  const handleFieldChange = (field, value) => {
    onQuestionChange(field, value);
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    handleFieldChange('options', newOptions);
  };

  return (
    <Paper elevation={2} className="p-6 rounded-lg bg-white mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <HelpIcon color="primary" />
          <Typography variant="h6" component="h3">Question</Typography>
        </div>
        {!isLast && (
          <Tooltip title="Remove question">
            <IconButton onClick={onRemove} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
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
          InputProps={{
            endAdornment: (
              <Tooltip title="Enter the question you want to ask">
                <HelpIcon color="action" fontSize="small" />
              </Tooltip>
            )
          }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TimeIcon color="action" fontSize="small" />
              <Typography variant="subtitle2">Time Limit (seconds)</Typography>
            </div>
            <Slider
              value={question.timeLimit}
              onChange={(e, newValue) => handleFieldChange('timeLimit', newValue)}
              aria-labelledby="time-limit-slider"
              valueLabelDisplay="auto"
              step={5}
              marks
              min={5}
              max={60}
            />
            <Typography variant="body2" className="text-center mt-2">
              {question.timeLimit} seconds
            </Typography>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <PointsIcon color="action" fontSize="small" />
              <Typography variant="subtitle2">Points</Typography>
            </div>
            <FormControl fullWidth>
              <Select
                value={question.points}
                onChange={(e) => handleFieldChange('points', e.target.value)}
                displayEmpty
              >
                {[100, 200, 300, 500, 1000, 2000].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value} points
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        <div className="space-y-4">
          <Typography variant="subtitle2">
            Answer Options
          </Typography>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center space-x-2">
              <TextField
                fullWidth
                value={option}
                onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                placeholder={`Option ${optionIndex + 1}`}
                variant="outlined"
              />
              <Tooltip title={question.correctAnswer === optionIndex ? "Currently correct" : "Mark as correct"}>
                <IconButton
                  onClick={() => handleFieldChange('correctAnswer', optionIndex)}
                  color={question.correctAnswer === optionIndex ? "success" : "default"}
                  aria-label={`mark option ${optionIndex + 1} as correct`}
                >
                  {question.correctAnswer === optionIndex ? 
                    <CorrectIcon /> : 
                    <UncheckedIcon />
                  }
                </IconButton>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </Paper>
  );
};

export default QuestionForm;