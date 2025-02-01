import React, { useState } from 'react';

const QuestionForm = ({ question, index, onChange, onRemove, isRemovable }) => {
  const [imagePreview, setImagePreview] = useState(question.imageUrl || '/quiz.jpeg');

  const handleQuestionChange = (field, value) => {
    onChange(index, field, value);
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    handleQuestionChange('options', newOptions);
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
        handleQuestionChange('imageUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Question {index + 1}</h3>
        {isRemovable && (
          <button
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Text
          </label>
          <input
            type="text"
            value={question.text}
            onChange={(e) => handleQuestionChange('text', e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Enter question text"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              value={question.timeLimit}
              onChange={(e) => handleQuestionChange('timeLimit', parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="5"
              max="60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points
            </label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              step="100"
              min="100"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Options
          </label>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`correct-${index}`}
                checked={question.correctAnswer === optionIndex}
                onChange={() => handleQuestionChange('correctAnswer', optionIndex)}
                className="focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${optionIndex + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
