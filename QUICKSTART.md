# Local Run Guide (Frontend)

This guide will help you get the graphical interface running on your computer for development and testing.

## Prerequisites

1.  **Backend Running:** Make sure your API (Backend) is running at `http://localhost:8080`.
2.  **Modern Browser:** Chrome, Firefox, Edge, etc.
3.  **Code Editor:** VS Code is recommended.

## Step 1: Environment Configuration

Open the `config.js` file in the project root and make sure it points to your local backend:

```javascript
const CONFIG = {
  API_URL: "http://localhost:8080/api",
};
```

_Note: If your backend is running on a different port, update the number here._

## Step 2: Start the Local Server

Do not open the `index.html` file by double-clicking it (this may block `fetch` requests due to security policies). Use one of these methods:

### Option A: VS Code "Live Server" (Recommended)

1.  Install the **Live Server** extension in VS Code.
2.  Open the `index.html` file.
3.  Right-click and select **"Open with Live Server"**.
4.  The page will open automatically (usually at `http://127.0.0.1:5500`).

### Option B: Python (No extra installation)

If you have Python installed, open a terminal in the frontend folder and run:

```bash
# For Python 3
python -m http.server 5500
```

Then go to `http://localhost:5500` in your browser.

### Option C: Node.js

If you prefer Node, you can use `http-server`:

```bash
npx http-server . -p 5500
```

## Common Troubleshooting

- **CORS Error:** If you see a "CORS Policy" error in the console, verify that your backend allows connections from `http://localhost:5500` (or whichever port you are using).
- **Cannot Login:** Check that the URL in `config.js` does not have an extra slash `/` at the end or typos.

---

# Cloud Deployment Guide (Frontend)

Follow these steps to publish your application to the internet using free static hosting services (like Netlify or Vercel).

## Before You Start

You need to have your **Backend already deployed** to the cloud (e.g., on Render or Railway) and have its public URL ready (e.g., `https://my-pomodoro-api.onrender.com`).

## Step 1: Production Configuration

Before uploading the files, you must "point" your frontend to the production backend.

1.  Open the `config.js` file.
2.  Change the local address to your cloud backend URL:

```javascript
const CONFIG = {
  // API_URL: "http://localhost:8080/api", // COMMENT OUT LOCAL
  API_URL: "https://your-real-backend.onrender.com/api", // USE PRODUCTION
};
```

## Step 2: Deploy ("Drag & Drop" Method)

The fastest way if you don't want to configure Git:

### Option A: Netlify (Very Easy)

1.  Go to [app.netlify.com](https://app.netlify.com) and log in.
2.  Go to the "Sites" section.
3.  Drag **your entire frontend folder** (where `index.html`, `login.js`, etc. are located) to the area that says "Drag and drop your site folder here".
4.  Done\! In a few seconds, it will give you a URL (e.g., `https://my-pomodoro-app.netlify.app`).

### Option B: Vercel

1.  Install Vercel CLI: `npm i -g vercel`
2.  In the terminal, inside your frontend folder, type: `vercel`.
3.  Follow the instructions (Enter, Enter, Enter...).
4.  It will give you the production URL when finished.

## Step 3: Authorize in the Backend (CORS)

This is the most important part. Your backend will likely block the new site for security reasons.

1.  Go to your Backend configuration (where you have your environment variables).
2.  Find the `FRONTEND_URL` variable (or `CORS_ORIGIN`).
3.  Update it with the new URL that Netlify or Vercel gave you (without the trailing slash).
    - Example: `https://my-pomodoro-app.netlify.app`
4.  Restart your Backend.

## Verification

1.  Go to your new frontend URL.
2.  Open the browser console (F12).
3.  Try to log in.
4.  If there are no red errors in the console, congratulations\! You are live.

```

```
