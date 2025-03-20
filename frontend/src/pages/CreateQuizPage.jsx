import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StepIndicator from '../components/common/StepIndicator';
import Header from '../components/Header'
import Footer from '../components/Footer';

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
  teams: [],
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

  const handleTeamsChange = (teams) => {
    console.log('Teams changed:', teams);
    setQuiz(prev => ({ ...prev, teams }));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
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
              onTeamsChange={handleTeamsChange}
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
              singleTeamMode={false}
            />
            
            {/* Navigation buttons removed since they're now in each step component */}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateQuizPage;