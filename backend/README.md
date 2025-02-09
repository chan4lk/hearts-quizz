# BistecQuizz Backend

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Port for the backend server
PORT=5001

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

## Default Values
If environment variables are not set, the following defaults will be used:
- PORT: 5001
- FRONTEND_URL: http://localhost:3000
- ADMIN_USERNAME: admin
- ADMIN_PASSWORD: admin123

For security reasons, it's recommended to:
1. Always set ADMIN_PASSWORD in production
2. Use a strong password
3. Keep your .env file secure and never commit it to version control

## Recreate DB
```shell
rm -f backend/db/khoot.sqlite && node backend/scripts/init-db.js
```