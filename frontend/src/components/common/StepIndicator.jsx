import React from 'react';

const StepIndicator = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      {steps.map((step, index) => (
        <button
          key={index}
          onClick={() => onStepClick(index)}
          className={`flex-1 text-center py-2 relative ${
            currentStep === index
              ? 'border-b-2 border-blue-500 text-blue-500'
              : index < currentStep
              ? 'border-b text-gray-700'
              : 'border-b text-gray-400'
          }`}
        >
          <div className="flex items-center justify-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 ${
                currentStep === index
                  ? 'bg-blue-500 text-white'
                  : index < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            {step.title}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`absolute right-0 top-1/2 w-full h-0.5 -z-10 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default StepIndicator;
