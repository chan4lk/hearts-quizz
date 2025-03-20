import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import QuizBasicForm from '../forms/QuizBasicForm';
import QuestionForm from '../forms/QuestionForm';
import TeamsForm from '../forms/TeamsForm';
import DeleteIcon from '@mui/icons-material/Delete';

const QuizCreationSteps = ({
  currentStep,
  quiz,
  onBasicInfoChange,
  onTeamsChange,
  onQuestionChange,
  onQuestionAdd,
  onQuestionRemove,
  onStepChange,
  onSubmit,
  isStepValid,
  singleTeamMode = false,
  icons = {}
}) => {
  const handleNext = () => {
    if (isStepValid()) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuizBasicForm
            quiz={quiz}
            onInputChange={onBasicInfoChange}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <TeamsForm
            teams={quiz.teams}
            onTeamsChange={onTeamsChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <div className="space-y-8">
            {quiz.questions.map((question, index) => (
              <div key={index} className="relative">
                <div className="absolute -top-4 -right-4 z-10">
                  <Tooltip title="Remove Question">
                    <IconButton
                      onClick={() => onQuestionRemove(index)}
                      color="error"
                      className="bg-white shadow-md hover:bg-red-50"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </div>
                <QuestionForm
                  question={question}
                  onQuestionChange={(field, value) =>
                    onQuestionChange(index, field, value)
                  }
                  onRemove={() => onQuestionRemove(index)}
                  isLast={index === quiz.questions.length - 1}
                  icons={icons}
                />
              </div>
            ))}
            
            <div className="flex flex-col gap-4">
              <Button
                variant="outlined"
                onClick={onQuestionAdd}
                fullWidth
                startIcon={icons.add}
              >
                Add Question
              </Button>
              
              <div className="flex gap-4">
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  fullWidth
                >
                  Previous
                </Button>
                
                <Button
                  variant="contained"
                  onClick={onSubmit}
                  fullWidth
                  disabled={!isStepValid()}
                  startIcon={icons.save}
                >
                  Create Quiz
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderCurrentStep()}
    </div>
  );
};

export default QuizCreationSteps;
