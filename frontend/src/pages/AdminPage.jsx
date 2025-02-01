import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../hooks/useSocket';

const AdminPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Quiz response:', response.data); // Debug log

      // Ensure response.data is an array
      const quizData = Array.isArray(response.data) ? response.data : [];
      setQuizzes(quizData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      } else {
        setError('Failed to fetch quizzes');
      }
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    try {
      // Navigate to host view with quiz data
      navigate(`/host/${quiz.pin}`, { state: { quiz } });
    } catch (error) {
      console.error('Error starting quiz:', error);
      setError('Failed to start quiz');
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Quiz Management</h1>
          <div className="space-x-4">
            <button
              onClick={handleCreateQuiz}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create New Quiz
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {quizzes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No quizzes found. Create your first quiz!
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quiz.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {quiz.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {quiz.question_count} questions
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-500">
                        {quiz.pin}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Start
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
