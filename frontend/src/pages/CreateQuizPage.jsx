import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuizBasicForm from '../components/forms/QuizBasicForm';
import QuestionForm from '../components/forms/QuestionForm';
import StepIndicator from '../components/common/StepIndicator';

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    category: '',
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
  });
  const [error, setError] = useState(null);

  const handleBasicInfoChange = (field, value) => {
    setQuiz({ ...quiz, [field]: value });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          text: '',
          imageUrl: '/quiz.jpeg',
          timeLimit: 30,
          points: 1000,
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const compressImage = async (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      // Compress images before sending
      const compressedQuestions = await Promise.all(
        quiz.questions.map(async (q) => ({
          ...q,
          imageUrl: q.imageUrl && q.imageUrl !== '/quiz.jpeg' 
            ? await compressImage(q.imageUrl)
            : q.imageUrl
        }))
      );

      const quizWithCompressedImages = {
        ...quiz,
        questions: compressedQuestions
      };

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/quizzes`, quizWithCompressedImages, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      navigate('/admin');
    } catch (error) {
      console.error('Error creating quiz:', error);
      setError('Failed to create quiz');
    }
  };

  const validateStep = () => {
    if (currentStep === 0) {
      return quiz.title && quiz.description && quiz.category;
    } else if (currentStep === 1) {
      return quiz.questions.every(q => 
        q.text && 
        q.options.every(opt => opt) && 
        q.timeLimit >= 5 && 
        q.timeLimit <= 60 &&
        q.points >= 100
      );
    }
    return true;
  };

  const steps = [
    {
      title: 'Basic Information',
      content: (
        <QuizBasicForm
          quiz={quiz}
          onChange={handleBasicInfoChange}
        />
      )
    },
    {
      title: 'Questions',
      content: (
        <div className="space-y-8">
          {quiz.questions.map((question, index) => (
            <QuestionForm
              key={index}
              question={question}
              index={index}
              onChange={handleQuestionChange}
              onRemove={removeQuestion}
              isRemovable={quiz.questions.length > 1}
            />
          ))}
          <button
            onClick={addQuestion}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Question
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            ← Back to Quiz List
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />

          <div className="mb-8">{steps[currentStep].content}</div>

          <div className="flex justify-between">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Previous
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => validateStep() && setCurrentStep(currentStep + 1)}
                className={`px-4 py-2 rounded ml-auto ${
                  validateStep()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!validateStep()}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className={`px-4 py-2 rounded ml-auto ${
                  validateStep()
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!validateStep()}
              >
                Create Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizPage;
