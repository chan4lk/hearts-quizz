import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quizData, setQuizData] = useState({
    title: '',
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    // Implement login logic
    setIsLoggedIn(true);
  };

  const handleAddQuestion = () => {
    setQuizData((prev) => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const handleCreateQuiz = async () => {
    // Implement quiz creation logic
    navigate('/');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-600">Quiz Management</h1>

        {/* Quiz Title */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quiz Title</h2>
          <input
            type="text"
            value={quizData.title}
            onChange={(e) => setQuizData({...quizData, title: e.target.value})}
            placeholder="Enter quiz title"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Question Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Question</h2>
          <div className="space-y-4">
            <textarea
              value={currentQuestion.text}
              onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
              placeholder="Enter question text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={currentQuestion.correctAnswer === index}
                  onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: index})}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...currentQuestion.options];
                    newOptions[index] = e.target.value;
                    setCurrentQuestion({...currentQuestion, options: newOptions});
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <button
              onClick={handleAddQuestion}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Question
            </button>
          </div>
        </div>

        {/* Quiz Preview */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quiz Preview</h2>
          <div className="space-y-4">
            {quizData.questions.map((question, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-medium mb-2">{question.text}</p>
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <span className={`w-4 h-4 rounded-full border ${
                        i === question.correctAnswer ? 'border-green-500 bg-green-100' : 'border-gray-300'
                      }`}></span>
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Quiz Button */}
        <button
          onClick={handleCreateQuiz}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Quiz
        </button>
      </div>
    </div>
  );
}

export default AdminPage;
