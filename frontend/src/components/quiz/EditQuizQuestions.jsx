import React, { useState } from 'react';
import { Button, Paper, CircularProgress } from '@mui/material';
import QuestionForm from '../forms/QuestionForm';
import axios from 'axios';
import { API_URL } from '../../config/env';

const EditQuizQuestions = ({ quiz, onQuestionsUpdated }) => {
  const [questions, setQuestions] = useState(quiz?.questions ? quiz.questions.map(q => ({
    text: q.text,
    imageUrl: q.image,
    timeLimit: q.timeLimit,
    points: q.points,
    options: q.options,
    correctAnswer: q.correctAnswer || 0
  })) : []);
  const [saving, setSaving] = useState(false);

  if (!quiz?.questions) {
    return (
      <Paper className="p-6 flex justify-center items-center">
        <CircularProgress />
      </Paper>
    );
  }

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setQuestions(newQuestions);
  };

  const handleQuestionRemove = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleQuestionAdd = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        imageUrl: '/quiz.jpeg',
        timeLimit: 30,
        points: 1000,
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/quizzes/${quiz.id}/questions`,
        { questions },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (onQuestionsUpdated) {
        onQuestionsUpdated(response.data);
      }
    } catch (error) {
      console.error('Error updating questions:', error);
      alert('Failed to update questions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Edit Questions</h2>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionForm
            key={index}
            question={question}
            onQuestionChange={(field, value) => handleQuestionChange(index, field, value)}
            onRemove={() => handleQuestionRemove(index)}
            isLast={questions.length === 1}
          />
        ))}
      </div>

      <Button
        variant="outlined"
        color="primary"
        onClick={handleQuestionAdd}
        fullWidth
      >
        Add Question
      </Button>
    </Paper>
  );
};

export default EditQuizQuestions;
