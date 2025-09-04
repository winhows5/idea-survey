# Survey Application Setup Guide

This is a Next.js survey application for collecting user feedback on app ideas from different sources. The application uses React for the frontend, MySQL for data storage, and TypeScript for type safety.

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- MySQL database server

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd questionaire

# Install dependencies
npm install
# or
yarn install
```

### 2. Database Setup

1. Create a MySQL database:
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE survey_app;
USE survey_app;
```

2. Import the schema:
```bash
# Import schema from project directory
mysql -u your_username -p survey_app < schema/schema.sql
```

3. Update database connection settings in `lib/database.ts` with your MySQL credentials:
   - Host: Your MySQL server host (default: localhost)
   - User: Your MySQL username
   - Password: Your MySQL password
   - Database: survey_app (or your chosen name)

### 3. CSV Data Setup

Ensure the CSV file is present:
```bash
# Verify CSV file exists
ls -la schema/INPUT_Normalized_ideas_samples_20250831.csv
```

### 4. Development Server

Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. Production Build

To build and run for production:
```bash
# Build the application
npm run build
# or
yarn build

# Start production server
npm start
# or
yarn start
```

### 6. Database Connection Test

Test your database connection:
```bash
# Check if database connection works
curl http://localhost:3000/api/apps
```

## Project Structure

- `src/app/` - Next.js app router pages
- `lib/` - Utility functions (database, CSV processing, types)
- `schema/` - Database schema and CSV data
- `src/components/` - Reusable React components

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

## Features

- Multi-page survey flow with progress tracking
- App familiarity screening
- Usage frequency collection
- Idea evaluation across multiple sources
- MySQL data storage with duplicate prevention
- Responsive design with Tailwind CSS

## Database Schema

The application stores survey responses in a MySQL table with fields for:
- Response ID and timestamps
- User demographics (Prolific ID)
- App familiarity and usage frequency
- Evaluation data for each source (DBGNN, UFGC, COT, ZERO, VALIDATION)

For detailed database structure, refer to `schema/schema.sql`.

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL service status
sudo service mysql status
# or on macOS with Homebrew
brew services list | grep mysql

# Restart MySQL if needed
sudo service mysql restart
# or on macOS
brew services restart mysql
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### Clear Application Data
```bash
# Clear browser localStorage for fresh start
# Open browser dev tools > Application > Local Storage > Clear
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [React Documentation](https://reactjs.org/docs) - learn about React
- [TypeScript Documentation](https://www.typescriptlang.org/docs) - learn about TypeScript
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS
