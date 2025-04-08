# BistecQuizz

A real-time quiz application inspired by Kahoot, built with React and Node.js.

## Project Structure

```
khoot-clone/
├── frontend/          # React frontend
│   ├── src/          # Source files
│   ├── Dockerfile    # Frontend Docker configuration
│   └── package.json  # Frontend dependencies
├── backend/          # Node.js backend
│   ├── server.js     # Main server file
│   ├── Dockerfile    # Backend Docker configuration
│   └── package.json  # Backend dependencies
└── docker-compose.yml # Docker compose configuration
```

## Technologies Used

### Frontend
- React
- Vite (Build tool)
- Socket.io Client (Real-time communication)
- React Router (Navigation)
- Axios (HTTP client)

### Backend
- Node.js
- Express
- Socket.io (Real-time communication)
- SQLite3 (Database)

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. Clone the repository:
```bash
git clone <repository-url>
cd khoot-clone
```

2. Start the application using Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Login Details

### Admin Accounts

1. Superadmin Account:
- Username: `Bistec`
- Password: `Bistec98`
- Email: `admin@example.com`
- Role: `superadmin`

2. Regular Admin Account:
- Username: `newadmin`
- Password: `admin123`
- Email: `newadmin@example.com`
- Role: `admin`

### Account Roles and Permissions

- **Superadmin**: Full access to all features including:
  - Creating, updating, and deleting admin users
  - Managing all quizzes
  - Accessing all admin settings
  - Viewing and managing all user data

- **Regular Admin**: Limited access to:
  - Creating and managing their own quizzes
  - Viewing and updating their own profile
  - Basic quiz management features

## Features

- Real-time quiz participation
- Admin interface for creating and managing quizzes
- Live quiz sessions with immediate feedback
- Score tracking and leaderboard
- Multiple choice questions support

## Development

### Frontend Development
The frontend is built with React and uses Vite for development and building. It's configured to work with the backend API and supports hot module replacement during development.

### Backend Development
The backend uses Express.js and Socket.io for real-time communication. SQLite is used as the database for storing quiz data and results.

## Docker Configuration

The project uses Docker Compose to run both frontend and backend services:

- Frontend container runs on port 3000
- Backend container runs on port 5001
- Volumes are configured for hot-reloading during development

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
