import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/env';
import EditQuizQuestions from '../components/quiz/EditQuizQuestions';

const AdminPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingQuizId, setEditingQuizId] = useState(null);
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

  const handleEditQuestions = async (quiz) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/quizzes/pin/${quiz.pin}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEditingQuizId(quiz.id);
      // Update the quiz in the list with full data
      setQuizzes(quizzes.map(q => 
        q.id === quiz.id ? { ...q, ...response.data } : q
      ));
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      alert('Failed to load quiz details. Please try again.');
    }
  };

  const handleQuestionsUpdated = async (updatedQuestions) => {
    try {
      // Refresh the quiz list to get updated question count
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/quizzes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setQuizzes(response.data);
      setEditingQuizId(null);
    } catch (error) {
      console.error('Error refreshing quiz list:', error);
      // Still update the local state even if refresh fails
      setQuizzes(quizzes.map(quiz => 
        quiz.id === editingQuizId 
          ? { ...quiz, question_count: updatedQuestions.length }
          : quiz
      ));
      setEditingQuizId(null);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">My Quizzes</h1>
            <div className="flex space-x-4">
              <button
                onClick={handleCreateQuiz}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Create Quiz
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transform transition-all duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">You haven't created any quizzes yet.</p>
              <p className="text-gray-500 mt-2">
                Click the "Create Quiz" button to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-md"
                >
                  <div className="text-center sm:text-left mb-4 sm:mb-0">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start">
                      <svg className="h-4 w-4 mr-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {quiz.question_count} questions
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="text-lg font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                      PIN: {quiz.pin}
                    </div>
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transform transition-all duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Quiz
                    </button>
                    <button
                      onClick={() => handleEditQuestions(quiz)}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transform transition-all duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {editingQuizId && (
            <div className="mt-8">
              <EditQuizQuestions
                quiz={quizzes.find(q => q.id === editingQuizId)}
                onQuestionsUpdated={handleQuestionsUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
