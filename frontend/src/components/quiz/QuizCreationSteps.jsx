import React from 'react';
import { Button } from '@mui/material';
import QuizBasicForm from '../forms/QuizBasicForm';
import QuestionForm from '../forms/QuestionForm';
import TeamsForm from '../forms/TeamsForm';

const QuizCreationSteps = ({
  currentStep,
  quiz,
  onBasicInfoChange,
  onTeamAdd,
  onTeamRemove,
  onTeamNameChange,
  onQuestionChange,
  onQuestionAdd,
  onQuestionRemove,
  onStepChange,
  onSubmit,
  isStepValid
}) => {
  const handleNext = () => {
    if (isStepValid()) {
      onStepChange(currentStep + 1);
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
            onTeamAdd={onTeamAdd}
            onTeamRemove={onTeamRemove}
            onTeamNameChange={onTeamNameChange}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <div className="space-y-8">
            {quiz.questions.map((question, index) => (
              <QuestionForm
                key={index}
                question={question}
                onQuestionChange={(field, value) =>
                  onQuestionChange(index, field, value)
                }
                onRemove={() => onQuestionRemove(index)}
                isLast={index === quiz.questions.length - 1}
              />
            ))}
            
            <div className="flex gap-4">
              <Button
                variant="outlined"
                onClick={onQuestionAdd}
                fullWidth
              >
                Add Question
              </Button>
              
              <Button
                variant="contained"
                onClick={onSubmit}
                fullWidth
                disabled={!isStepValid()}
              >
                Create Quiz
              </Button>
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
      
      <div className="flex justify-between mt-6">
        {currentStep > 0 && (
          <Button
            variant="outlined"
            onClick={() => onStepChange(currentStep - 1)}
          >
            Previous
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizCreationSteps;
