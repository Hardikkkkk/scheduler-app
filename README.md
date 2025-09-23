# Scheduler App

## Live Demo

- Frontend URL: https://scheduler-app-chi.vercel.app/
- Backend API URL: https://scheduler-app1.onrender.com

*PLEASE NOTE:* The backend API only serves responses at its endpoints (e.g., /slots). Browsing the base URL will show { "error": "Not Found" } as expected for API-only services.  Kindly search https://scheduler-app1.onrender.com/slots?week=2025-09-22 for fetching the data.

## Project Overview

This is a scheduling application to manage recurring and exception calendar slots.  
The project includes a backend REST API built with Node.js, Express, PostgreSQL, Knex, and TypeScript. The frontend is a React app built with Vite.

## Technologies Used

- Backend: Node.js, Express, TypeScript, Knex, PostgreSQL
- Frontend: React, Vite, TypeScript
- Deployment: Render (backend), Vercel (frontend)

## Setup Instructions

### Backend

1. Set environment variables:
   - `DATABASE_URL`: PostgreSQL connection string.
2. Install dependencies:
    - cd backend
    - npm install
3. Run database migrations:
    - npx knex migrate:latest --env production
4. Start the backend:
    - npm run start


### Frontend

1. Set environment variable:
- `VITE_API_BASE_URL`: URL of the backend API (e.g., `https://scheduler-app-wezv.onrender.com`).
2. Install dependencies:
    -cd frontend
    -npm install
3. Run for development:
    -npm run dev
4. Build for production:
    -npm run build



