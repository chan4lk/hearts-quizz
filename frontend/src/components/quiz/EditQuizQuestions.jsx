import React, { useState } from 'react';
import { Button, Paper, CircularProgress, IconButton, Tooltip } from '@mui/material';
import QuestionForm from '../forms/QuestionForm';
import axios from 'axios';
import { API_URL } from '../../config/env';
import DeleteIcon from '@mui/icons-material/Delete';

const EditQuizQuestions = ({ quiz, onQuestionsUpdated }) => {
  const [questions, setQuestions] = useState(quiz?.questions ? quiz.questions.map(q => ({
    text: q.text,
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
          <div key={index} className="relative">
            <div className="absolute -top-4 -right-4 z-10">
              <Tooltip title="Remove Question">
                <IconButton
                  onClick={() => handleQuestionRemove(index)}
                  color="error"
                  className="bg-white shadow-md hover:bg-red-50"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Question {index + 1}</h3>
              </div>
            </div>

            <QuestionForm
              question={question}
              onQuestionChange={(field, value) => handleQuestionChange(index, field, value)}
              onRemove={() => handleQuestionRemove(index)}
              isLast={questions.length === 1}
            />
          </div>
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
