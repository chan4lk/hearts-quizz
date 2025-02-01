import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/login`, {
        username: e.target.username.value,
        password: e.target.password.value
      });
      if (response.data.success) {
        setIsLoggedIn(true);
        setError('');
      }
    } catch (err) {
      setError('Invalid credentials');
      console.error('Login error:', err);
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt)) {
      setError('Please fill in all question fields');
      return;
    }
    setQuizData((prev) => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
    setError('');
  };

  const handleCreateQuiz = async () => {
    try {
      if (!quizData.title || quizData.questions.length === 0) {
        setError('Please add a title and at least one question');
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/quiz/create`, quizData);
      
      if (response.data.success) {
        navigate('/');
      } else {
        setError('Failed to create quiz');
      }
    } catch (err) {
      setError('Error creating quiz');
      console.error('Quiz creation error:', err);
    }
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Admin Login</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-semibold mb-6">Create Quiz</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Quiz Title"
            value={quizData.title}
            onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Question</h2>
          <input
            type="text"
            placeholder="Question Text"
            value={currentQuestion.text}
            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="mb-2 flex gap-2">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                className={`px-4 py-2 rounded-lg ${
                  currentQuestion.correctAnswer === index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Correct
              </button>
            </div>
          ))}
          
          <button
            onClick={handleAddQuestion}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Question
          </button>
        </div>

        {quizData.questions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Questions Added ({quizData.questions.length})</h2>
            {quizData.questions.map((q, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{q.text}</p>
                <ul className="ml-4">
                  {q.options.map((opt, i) => (
                    <li key={i} className={i === q.correctAnswer ? 'text-green-600 font-semibold' : ''}>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleCreateQuiz}
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
        >
          Create Quiz
        </button>
      </div>
    </div>
  );
}

export default AdminPage;
