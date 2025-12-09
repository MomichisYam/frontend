# Pomodoro App – Frontend

Web interface for the Pomodoro application.  
This frontend communicates with the Pomodoro API backend.

## Live Demo

https://momichisyam.github.io/frontend/html/login.html

## Requirements

- Modern web browser
- Backend running (local or cloud)

## Run Locally

1. Clone this repository.
2. Open the project folder.
3. Update `config.js` with your backend URL.
4. Run with Live Server or:
   ```bash
   npx http-server . -p 5500
   ```
5. Open: http://localhost:5500

## Deployment (GitHub Pages)

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Select:
   - Source: `main` branch
   - Folder: `/ (root)`
4. Save.
5. GitHub will provide a public URL after build.

## Backend Dependency

This frontend requires the Pomodoro API backend.

Backend repository:
https://github.com/DarThunder/pomodoro-backend

Follow the backend Quick Start guide to run it locally or deploy it.

## CORS Configuration

When using GitHub Pages, make sure the backend allows requests from:

https://momichisyam.github.io

## Notes

- The frontend is a static application (HTML, CSS, JavaScript).
- Authentication is handled via secure HttpOnly cookies.
