import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StepIndicator from '../components/common/StepIndicator';
import Header from '../components/Header'

import QuizCreationSteps from '../components/quiz/QuizCreationSteps';
import { getStepValidator } from '../utils/quizValidation';
import { Alert, Tooltip, Fade } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

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
  const [saving, setSaving] = useState(false);

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
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col">
          <Header />
          <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <button 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200" 
              onClick={handleBack}
            >
              <ArrowBackIcon className="mr-1" />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <div className="flex items-center">
              <Tooltip 
                title="Create a new quiz with multiple steps. Fill in all required fields to proceed." 
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
                arrow
              >
                <HelpOutlineIcon className="text-gray-400 hover:text-blue-500 cursor-pointer ml-2" />
              </Tooltip>
            </div>
          </div>

          {error && (
            <Alert 
              severity="error" 
              className="mb-6 rounded-md"
              variant="filled"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <div className="mb-8">
            <StepIndicator currentStep={currentStep} totalSteps={3} />
          </div>

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
            icons={{
              add: <AddCircleOutlineIcon />,
              remove: <RemoveCircleOutlineIcon />,
              edit: <EditIcon />,
              timer: <TimerIcon />,
              points: <EmojiEventsIcon />,
              info: <InfoOutlinedIcon />,
              save: <SaveIcon />
            }}
            isSaving={saving}
          />
          
          <div className="flex justify-between items-center mt-8 border-t pt-6">
            <button
              onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
              className={`px-5 py-2 rounded-md flex items-center ${
                currentStep > 0 
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } transition-colors duration-200`}
              disabled={currentStep === 0}
            >
              <ArrowBackIcon className="mr-1" fontSize="small" />
              Previous
            </button>
            
            {currentStep < 2 ? (
              <button
                onClick={() => validateCurrentStep() && setCurrentStep(currentStep + 1)}
                className={`px-5 py-2.5 rounded-md flex items-center ${
                  validateCurrentStep() 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-300 text-white cursor-not-allowed'
                } transition-colors duration-200`}
                disabled={!validateCurrentStep()}
              >
                Next
                <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className={`px-5 py-2.5 rounded-md flex items-center ${
                  validateCurrentStep() && !saving
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-300 text-white cursor-not-allowed'
                } transition-colors duration-200`}
                disabled={!validateCurrentStep() || saving}
              >
                <SaveIcon className="mr-1" fontSize="small" />
                {saving ? 'Saving...' : 'Save Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CreateQuizPage;