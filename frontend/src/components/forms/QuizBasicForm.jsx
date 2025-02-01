import React from 'react';

const QuizBasicForm = ({ quiz, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quiz Title
        </label>
        <input
          type="text"
          value={quiz.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Enter quiz title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={quiz.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Enter quiz description"
          rows="3"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={quiz.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a category</option>
          <option value="general">General Knowledge</option>
          <option value="science">Science</option>
          <option value="history">History</option>
          <option value="geography">Geography</option>
          <option value="sports">Sports</option>
          <option value="entertainment">Entertainment</option>
          <option value="technology">Technology</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );
};

export default QuizBasicForm;
