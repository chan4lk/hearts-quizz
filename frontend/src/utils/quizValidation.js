/**
 * Validates the basic information step of quiz creation
 * @param {Object} quiz - The quiz object
 * @returns {boolean} - Whether the basic info is valid
 */
export const validateBasicInfo = (quiz) => {
  return Boolean(quiz.title && quiz.description && quiz.category);
};

/**
 * Validates the teams step of quiz creation
 * @param {Object} quiz - The quiz object
 * @returns {boolean} - Whether the teams setup is valid
 */
export const validateTeams = (quiz) => {
  return quiz.teams.length >= 2 && quiz.teams.every(team => team.name.trim());
};

/**
 * Validates a single question in the quiz
 * @param {Object} question - The question object
 * @returns {boolean} - Whether the question is valid
 */
export const validateQuestion = (question) => {
  return (
    question.text.trim() &&
    question.options.every(opt => opt.trim()) &&
    question.timeLimit > 0 &&
    question.points > 0 &&
    question.correctAnswer >= 0 &&
    question.correctAnswer < question.options.length
  );
};

/**
 * Validates the questions step of quiz creation
 * @param {Object} quiz - The quiz object
 * @returns {boolean} - Whether all questions are valid
 */
export const validateQuestions = (quiz) => {
  return quiz.questions.length > 0 && quiz.questions.every(validateQuestion);
};

/**
 * Gets the validation function for a specific step
 * @param {number} step - The current step number
 * @returns {Function} - The validation function for the step
 */
export const getStepValidator = (step) => {
  switch (step) {
    case 0:
      return validateBasicInfo;
    case 1:
      return validateTeams;
    case 2:
      return validateQuestions;
    default:
      return () => true;
  }
};
