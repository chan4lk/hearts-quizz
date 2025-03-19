# Database Implementation

This directory contains the database implementation for the Khoot Clone application. The application supports both SQLite and Microsoft SQL Server databases.

## Configuration

To configure the database, set the following environment variables in your `.env` file:

```
# Database type (sqlite or mssql)
DB_TYPE=sqlite

# MSSQL Configuration (only needed if DB_TYPE=mssql)
MSSQL_USER=sa
MSSQL_PASSWORD=YourStrongPassword
MSSQL_SERVER=localhost
MSSQL_DATABASE=khoot
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERTIFICATE=true
```

## Database Files

- `index.js`: Main database interface that supports both SQLite and MSSQL
- `transaction.js`: Transaction support for both database types
- `mssql.js`: Microsoft SQL Server implementation

## Usage

The application will automatically use the configured database type. No code changes are needed in your application logic as the database interface provides a consistent API for both database types.

## Switching Database Types

To switch between SQLite and MSSQL:

1. Set the `DB_TYPE` environment variable to either `sqlite` or `mssql`
2. If using MSSQL, ensure all MSSQL_* environment variables are properly configured
3. Restart the application

## Microsoft SQL Server Setup

To use Microsoft SQL Server:

1. Install SQL Server (or use a hosted instance)
2. Create a new database named `khoot` (or your preferred name)
3. Configure the connection details in your `.env` file
4. Set `DB_TYPE=mssql` in your `.env` file
5. Restart the application

The application will automatically create all necessary tables on first run.
