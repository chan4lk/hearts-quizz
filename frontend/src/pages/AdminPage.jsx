import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/env';
import Header from '../components/Header';
import Footer from '../components/Footer';

import EditQuizQuestions from '../components/quiz/EditQuizQuestions';
import { 
  ArrowBack, 
  Add, 
  Logout, 
  PlayArrow, 
  Edit, 
  Delete, 
  QuestionAnswer, 
  QuestionMark, 
  Dashboard, 
  PinDrop, 
  Search
} from '@mui/icons-material';

const AdminPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
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
      showNotification('Failed to load quiz details. Please try again.', 'error');
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
      showNotification('Questions updated successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing quiz list:', error);
      // Still update the local state even if refresh fails
      setQuizzes(quizzes.map(quiz => 
        quiz.id === editingQuizId 
          ? { ...quiz, question_count: updatedQuestions.length }
          : quiz
      ));
      setEditingQuizId(null);
      showNotification('Questions updated, but refresh failed.', 'warning');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (window.confirm(`Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/quizzes/${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
        showNotification('Quiz deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting quiz:', error);
        showNotification('Failed to delete quiz. Please try again.', 'error');
      }
    }
  };

  const showNotification = (message, type = 'info') => {
    // You can implement a toast notification system here
    // For now, we'll use alert
    alert(message);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.pin.toString().includes(searchTerm)
  );

  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    if (sortBy === 'title') {
      return sortOrder === 'asc' 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title);
    } else if (sortBy === 'questions') {
      return sortOrder === 'asc' 
        ? a.question_count - b.question_count 
        : b.question_count - a.question_count;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading your quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-600 flex items-center justify-center mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100">
      <Header />
      <main className="flex-grow p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 transition-all duration-300">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center">
                <button 
                  className="mr-3 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                  onClick={handleBack}
                  aria-label="Go back"
                >
                  <ArrowBack />
                </button>
                <div className="flex items-center">
                  <Dashboard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Quiz Dashboard
                  </h1>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleCreateQuiz}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-150 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                >
                  <Add className="h-5 w-5 mr-1 sm:mr-2" />
                  <span>Create Quiz</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-150 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
                >
                  <Logout className="h-5 w-5 mr-1 sm:mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  placeholder="Search quizzes by title or PIN..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Quiz List Section */}
            {sortedQuizzes.length === 0 ? (
              <div className="text-center py-10 sm:py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No quizzes found matching "{searchTerm}"</p>
                    <p className="text-gray-500 mt-2">Try a different search term or clear the search</p>
                  </>
                ) : (
                  <>
                    <QuestionAnswer className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">You haven't created any quizzes yet</p>
                    <p className="text-gray-500 mt-2">
                      Click the "Create Quiz" button to get started!
                    </p>
                    <button
                      onClick={handleCreateQuiz}
                      className="mt-6 bg-blue-600 text-white px-5 py-2 sm:px-6 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-150 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center mx-auto"
                    >
                      <Add className="h-5 w-5 mr-2" />
                      Create Your First Quiz
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                {/* Table Header for desktop */}
                <div className="hidden sm:grid grid-cols-12 bg-gray-100 py-3 px-4 sm:px-6 border-b border-gray-200">
                  <div 
                    className="col-span-5 font-medium text-gray-700 cursor-pointer flex items-center"
                    onClick={() => handleSort('title')}
                  >
                    Quiz Title
                    {sortBy === 'title' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div 
                    className="col-span-2 font-medium text-gray-700 cursor-pointer flex items-center"
                    onClick={() => handleSort('questions')}
                  >
                    Questions
                    {sortBy === 'questions' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 font-medium text-gray-700 text-center">PIN</div>
                  <div className="col-span-3 font-medium text-gray-700 text-center">Actions</div>
                </div>
                
                {/* Table Body */}
                <div className="bg-white divide-y divide-gray-200">
                  {sortedQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="hover:bg-gray-50 transition-all duration-200"
                    >
                      {/* Mobile View */}
                      <div className="sm:hidden p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-[70%]">{quiz.title}</h3>
                          <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm">
                            <PinDrop className="h-4 w-4 mr-1" />
                            {quiz.pin}
                          </div>
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <QuestionMark className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">{quiz.question_count} questions</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartQuiz(quiz)}
                            className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-600 transition-all duration-150 flex items-center justify-center text-sm"
                            aria-label="Start Quiz"
                          >
                            <PlayArrow className="h-4 w-4 mr-1" />
                            Start
                          </button>
                          <button
                            onClick={() => handleEditQuestions(quiz)}
                            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all duration-150 flex items-center justify-center text-sm"
                            aria-label="Edit Questions"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                            className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-all duration-150 flex items-center justify-center text-sm"
                            aria-label="Delete Quiz"
                          >
                            <Delete className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Desktop View */}
                      <div className="hidden sm:grid grid-cols-12 items-center h-14 sm:h-16 px-4 sm:px-6">
                        <div className="col-span-5 text-gray-800 font-medium truncate pr-2">
                          {quiz.title}
                        </div>
                        <div className="col-span-2 flex items-center justify-start sm:justify-center">
                          <div className="flex items-center">
                            <QuestionMark className="h-4 w-4 text-gray-500 mr-1" />
                            <span className="text-gray-600">{quiz.question_count}</span>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-start sm:justify-center">
                          <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm">
                            <PinDrop className="h-4 w-4 mr-1" />
                            {quiz.pin}
                          </div>
                        </div>
                        <div className="col-span-3 flex items-center justify-end sm:justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleStartQuiz(quiz)}
                            className="bg-green-500 text-white p-1.5 sm:p-2 rounded-lg hover:bg-green-600 transition-all duration-150"
                            title="Start Quiz"
                            aria-label="Start Quiz"
                          >
                            <PlayArrow className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleEditQuestions(quiz)}
                            className="bg-blue-500 text-white p-1.5 sm:p-2 rounded-lg hover:bg-blue-600 transition-all duration-150"
                            title="Edit Questions"
                            aria-label="Edit Questions"
                          >
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                            className="bg-red-500 text-white p-1.5 sm:p-2 rounded-lg hover:bg-red-600 transition-all duration-150"
                            title="Delete Quiz"
                            aria-label="Delete Quiz"
                          >
                            <Delete className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Edit Questions Section */}
            {editingQuizId && (
              <div className="mt-8 border-t border-gray-200 pt-6 sm:pt-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center">
                  <Edit className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                  Edit Questions
                </h2>
                <EditQuizQuestions
                  quiz={quizzes.find(q => q.id === editingQuizId)}
                  onQuestionsUpdated={handleQuestionsUpdated}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;