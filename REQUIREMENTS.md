# BistecQuizz: Application Requirements

## Overview
BistecQuizz is a real-time quiz application inspired by Kahoot, providing an interactive and engaging platform for conducting quizzes. The application supports multiple participants, real-time scoring, and quiz management.

## User Roles

### Players
- Join quizzes using a PIN code
- Create/join teams
- Answer multiple-choice questions within time limits
- View immediate feedback on answers
- See real-time score updates and final rankings

### Administrators
- Create and manage quizzes
- Host live quiz sessions
- View participant results
- Control quiz flow (start/pause/end)
- Access analytics on quiz performance

## Functional Requirements

### Authentication
- Admin login with username/password
- JWT-based authentication
- Session management for quiz hosts and participants

### Quiz Management
- Create quizzes with title, description, and category
- Add multiple-choice questions with:
  - Question text
  - 2-4 answer options
  - Correct answer designation
  - Optional image attachment
  - Time limit per question (configurable)
  - Points value (configurable)
- Edit existing quizzes
- Delete quizzes
- Generate unique PIN codes for quiz sessions

### Quiz Participation
- Join quiz sessions via PIN code
- Support for individual or team-based participation
- Answer submission within time constraints
- Score calculation based on correctness and speed
- Real-time feedback on answer correctness

### Real-time Features
- Live question broadcasting to all participants
- Real-time answer collection
- Immediate scoring updates
- Live leaderboard display
- Host controls for quiz progression

### User Interface
- Responsive design supporting mobile and desktop
- Engaging animations for quiz flow
- Clear visual feedback for answer selection
- Timer display for questions
- Visual leaderboard representation

## Technical Requirements

### Frontend
- React-based single-page application
- Real-time updates via Socket.io
- Responsive layout using TailwindCSS
- Client-side routing with React Router
- State management for quiz flow

### Backend
- Node.js Express server
- RESTful API for quiz management
- Socket.io for real-time communication
- JWT authentication
- SQLite database for data persistence

### API Endpoints

#### Authentication
- POST `/api/auth/login` - Admin authentication

#### Quiz Management
- GET `/api/quizzes` - List all quizzes
- POST `/api/quizzes` - Create a new quiz
- GET `/api/quizzes/:id` - Get a specific quiz
- PUT `/api/quizzes/:id` - Update a quiz
- DELETE `/api/quizzes/:id` - Delete a quiz
- GET `/api/quizzes/pin/:pin` - Get quiz by PIN

### Real-time Events (Socket.io)

#### Host Events
- `start-quiz` - Begin a quiz session
- `next-question` - Advance to next question
- `end-question` - End the current question period
- `end-quiz` - End the entire quiz session

#### Player Events
- `join-quiz` - Join a quiz session
- `submit-answer` - Submit an answer to a question
- `leave-quiz` - Leave a quiz session

#### Broadcast Events
- `quiz-state-update` - Updates on quiz state
- `new-question` - New question broadcast
- `question-results` - Results after question ends
- `leaderboard-update` - Updated leaderboard data
- `quiz-ended` - Final quiz results

## Non-functional Requirements

### Performance
- Support for at least 100 concurrent participants
- Question loading time under 2 seconds
- Real-time update latency under 1 second

### Security
- Secure admin authentication
- Protection against answer spoofing
- Rate limiting for API endpoints

### Scalability
- Containerized deployment with Docker
- Horizontal scaling capability
- Efficient database queries

### Usability
- Intuitive UI for both hosts and participants
- Clear instructions for quiz flow
- Accessible design for various devices

## Development and Deployment

### Development Environment
- React with Vite for frontend development
- Node.js for backend development
- Docker for containerization
- Git for version control

### Deployment
- Docker Compose for multi-container deployment
- Environment-based configuration
- Health check endpoints
- Logging for troubleshooting

### Future Enhancements
- User account management beyond admin
- Advanced question types (free text, ordering, matching)
- Quiz templates and sharing
- Enhanced analytics and reporting
- Integration with LMS platforms 