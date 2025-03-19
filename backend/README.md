# BistecQuizz Backend

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Port for the backend server
PORT=5001

# Frontend URL for CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# JWT Authentication (REQUIRED for secure operation)
JWT_SECRET=your_secure_random_string_here

# Admin credentials (will be used to seed the database)
DEFAULT_ADMIN_PASSWORD=your_secure_password_here

# Node environment
NODE_ENV=development
```

## Default Values
If environment variables are not set, the following defaults will be used:
- PORT: 5001
- CORS_ALLOWED_ORIGINS: http://localhost:3000
- NODE_ENV: development

## Security Notes

### JWT Secret
The JWT_SECRET is **required** for secure authentication. Without it, the application will refuse to authenticate users.

To generate a secure random string for JWT_SECRET, you can use:
```shell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Admin Authentication
The application now uses proper password hashing with bcrypt. The default admin user is seeded with:
- Username: admin
- Password: Value of DEFAULT_ADMIN_PASSWORD (or admin123 in development mode only)

For security reasons, it's recommended to:
1. Always set JWT_SECRET in all environments
2. Set DEFAULT_ADMIN_PASSWORD to a strong password in production
3. Set NODE_ENV=production in production environments
4. Keep your .env file secure and never commit it to version control

## Recreate DB
```shell
rm -f backend/db/khoot.sqlite && node backend/scripts/init-db.js