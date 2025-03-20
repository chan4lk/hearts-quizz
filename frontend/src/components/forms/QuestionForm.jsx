import React, { useState } from 'react';
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
  CloudUpload as UploadIcon,
  Help as HelpIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const QuestionForm = ({ question, onQuestionChange, onRemove, isLast }) => {
  const [imagePreview, setImagePreview] = useState(question.imageUrl || '/up.png');
  const [dragActive, setDragActive] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

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
    processImageFile(file);
  };

  const processImageFile = (file) => {
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    handleFieldChange('imageUrl', '');
    setShowImageUpload(false);
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

        {!showImageUpload && !imagePreview && (
          <Button
            startIcon={<AddPhotoIcon />}
            variant="outlined"
            color="primary"
            onClick={() => setShowImageUpload(true)}
            className="w-full"
          >
            Add Image to Question
          </Button>
        )}

        {(showImageUpload || imagePreview) && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <Typography variant="subtitle2">
                Question Image
              </Typography>
              <Tooltip title="Remove Image">
                <IconButton
                  onClick={handleRemoveImage}
                  size="small"
                  color="error"
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </div>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex items-start space-x-4">
                <div className="w-32 h-32 relative">
                  <img
                    src={imagePreview || '/placeholder-image.png'}
                    alt=""
                    className="w-full h-full object-cover rounded border"
                    onError={(e) => {
                      e.target.src = '/up.png';
                      setImagePreview('/up.png');
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                      <UploadIcon />
                      <span>Upload an image</span>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Drop an image here or click to upload (max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
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