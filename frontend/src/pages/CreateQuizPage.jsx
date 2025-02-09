import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StepIndicator from '../components/common/StepIndicator';
import QuizCreationSteps from '../components/quiz/QuizCreationSteps';
import { getStepValidator } from '../utils/quizValidation';
import { Alert } from '@mui/material';

const INITIAL_QUIZ_STATE = {
  title: '',
  description: '',
  category: '',
  teams: [
    { id: 1, name: 'Starks', color: '#808080' },     // Grey - representing House Stark's direwolf
    { id: 2, name: 'Lannister', color: '#FFD700' },  // Gold - representing Lannister's wealth
    { id: 3, name: 'Targaryen', color: '#FF0000' }   // Red - representing Targaryen's dragons
  ],
  questions: [
    {
      text: '',
      imageUrl: '/quiz.jpeg',
      timeLimit: 30,
      points: 1000,
      options: ['', '', '', ''],
      correctAnswer: 0
    }
  ]
};

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [quiz, setQuiz] = useState(INITIAL_QUIZ_STATE);
  const [error, setError] = useState(null);

  const handleBasicInfoChange = (field, value) => {
    setQuiz(prev => ({ ...prev, [field]: value }));
  };

  const handleTeamAdd = (team) => {
    setQuiz(prev => ({
      ...prev,
      teams: [...prev.teams, team]
    }));
  };

  const handleTeamRemove = (teamId) => {
    setQuiz(prev => ({
      ...prev,
      teams: prev.teams.filter(team => team.id !== teamId)
    }));
  };

  const handleTeamNameChange = (teamId, newName) => {
    setQuiz(prev => ({
      ...prev,
      teams: prev.teams.map(team => 
        team.id === teamId ? { ...team, name: newName } : team
      )
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuiz(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleQuestionAdd = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          imageUrl: '/quiz.jpeg',
          timeLimit: 30,
          points: 1000,
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    }));
  };

  const handleQuestionRemove = (index) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const validateCurrentStep = () => {
    const validator = getStepValidator(currentStep);
    return validator(quiz);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/quizzes`, quiz, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          <StepIndicator currentStep={currentStep} totalSteps={3} />

          <QuizCreationSteps
            currentStep={currentStep}
            quiz={quiz}
            onBasicInfoChange={handleBasicInfoChange}
            onTeamAdd={handleTeamAdd}
            onTeamRemove={handleTeamRemove}
            onTeamNameChange={handleTeamNameChange}
            onQuestionChange={handleQuestionChange}
            onQuestionAdd={handleQuestionAdd}
            onQuestionRemove={handleQuestionRemove}
            onStepChange={setCurrentStep}
            onSubmit={handleSubmit}
            isStepValid={validateCurrentStep}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateQuizPage;
