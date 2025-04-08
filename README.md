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

1. Superadmin Account (ID: 1):
- Username: `Bistec`
- Password: `Bistec98`
- Email: `bistec@example.com`
- Role: `superadmin`
- Created: 2025-04-08 12:40:51
- Last Login: 2025-04-08 12:53:50

2. Superadmin Account (ID: 2):
- Username: `newadmin`
- Password: `admin123`
- Email: `newadmin@example.com`
- Role: `superadmin`
- Created: 2025-04-08 12:40:51
- Last Login: 2025-04-08 12:55:50

3. Superadmin Account (ID: 3):
- Username: `Tecbiz`
- Password: `Tecbiz98`
- Email: `tecbiz@example.com`
- Role: `superadmin`
- Created: [Current Date]
- Last Login: Never

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

## Database Management

### Direct Database Access

The application provides a command-line interface for direct database management through the `adminControl.js` script. This tool allows you to:

1. View all admin users
2. Add new admin users
3. Update existing admin users
4. Delete admin users

### Using the Admin Control Script

1. Navigate to the backend directory:
```bash
cd hearts-quizz/backend
```

2. Run the admin control script:
```bash
node scripts/adminControl.js
```

3. Choose from the following options:
   - `1`: View all admins
   - `2`: Add new admin
   - `3`: Update admin
   - `4`: Delete admin
   - `5`: Exit

### Admin Control Features

#### View All Admins
- Displays complete information about all admin users
- Shows ID, username, email, role, creation date, and last login
- Provides a total count of admin users

#### Add New Admin
- Create new admin users with custom credentials
- Set username, password, email, and role
- Passwords are automatically hashed for security
- Role options: `admin` or `superadmin`

#### Update Admin
- Modify existing admin user details
- Can update:
  - Username
  - Password
  - Email
  - Role
- Press Enter to keep current values
- Changes are applied immediately

#### Delete Admin
- Remove admin users from the database
- Requires confirmation before deletion
- Cannot be undone once confirmed

### Database Structure

The application uses SQLite3 as its database. The main tables include:

1. `admins` table structure:
   - `id`: Unique identifier
   - `username`: Admin username
   - `password`: Hashed password
   - `email`: Admin email
   - `role`: Admin role (admin/superadmin)
   - `created_at`: Account creation timestamp
   - `last_login`: Last login timestamp

### Security Notes

- All passwords are hashed using bcrypt
- Superadmin users have full access to all features
- Regular admin users have limited access
- Database operations are logged for security purposes

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
