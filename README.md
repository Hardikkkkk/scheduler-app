# Scheduler App

## Live Demo

- **Frontend URL**: https://scheduler-app-chi.vercel.app/
- **Backend API URL**: https://scheduler-app1.onrender.com
- **Health Check**: https://scheduler-app1.onrender.com/health

> **Note on Render Free Tier**: Render's free instances spin down after 15 minutes of inactivity. The initial request after sleep may take 50–60 seconds to spin up. A "Retry" button is provided in the UI for convenience.

## Project Overview

This is a scheduling application to manage recurring and exception calendar slots.  
The project includes a backend REST API built with Node.js, Express, PostgreSQL, Knex, and TypeScript. The frontend is a React app built with Vite.

## Technologies Used

- **Backend**: Node.js, Express, TypeScript, Knex, PostgreSQL
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Deployment**: Render (backend), Vercel (frontend)

## Setup Instructions

### Backend

1. **Environment Variables**:
   Create a `.env` file in `backend/` (see `backend/.env.example`):
   - `PORT`: (Optional, defaults to 3001)
   - `DATABASE_URL`: PostgreSQL connection string (in production or cloud DB)
   - Or local DB parameters: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```
3. **Run database migrations**:
   ```bash
   npx knex migrate:latest
   ```
4. **Build and start the backend**:
   ```bash
   npm run build
   npm run start
   ```

### Frontend

1. **Environment Variables**:
   Create a `.env` file in `frontend/` (see `frontend/.env.example`):
   - `VITE_API_BASE_URL`: URL of the backend API (e.g., `http://localhost:3001` locally, or `https://scheduler-app1.onrender.com` in production). Defaults to `http://localhost:3001` if omitted.
2. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```
3. **Run for development**:
   ```bash
   npm run dev
   ```
4. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment Notes

### Render (Backend)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment Variables**:
  - `DATABASE_URL`: Connection string of your PostgreSQL database (with SSL)
  - `NODE_ENV`: `production`

### Vercel (Frontend)
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://scheduler-app1.onrender.com` *(Must be set in Vercel Project Settings > Environment Variables, and requires a redeploy to take effect since Vite embeds env vars at build time)*
