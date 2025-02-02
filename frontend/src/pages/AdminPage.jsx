import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/env';

const AdminPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin/login');
          return;
        }

        const response = await axios.get(`${API_URL}/api/quizzes`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setQuizzes(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        if (err.response?.status === 401) {
          navigate('/admin/login');
        } else {
          setError('Failed to load quizzes');
        }
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [navigate]);

  const handleStartQuiz = (quiz) => {
    navigate(`/host/${quiz.pin}`, { state: { quiz } });
  };

  const handleCreateQuiz = () => {
    navigate('/create-quiz');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-red-600 text-center">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Quizzes</h1>
            <div className="space-x-4">
              <button
                onClick={handleCreateQuiz}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Create Quiz
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              <p>You haven't created any quizzes yet.</p>
              <p className="mt-2">
                Click the "Create Quiz" button to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {quiz.question_count} questions
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-medium text-blue-600">
                      PIN: {quiz.pin}
                    </div>
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Start Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
