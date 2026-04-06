# Firebase Playbook

One-time setup steps for the Firebase project. These only need to be done once per Firebase project.

## 1. Create the project

Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (or select an existing one).

## 2. Enable Google Sign-In

Authentication → Sign-in method → Google → **Enable** → Save.

## 3. Register the web app

Project settings (⚙️) → Your apps → **Add app** → Web (`</>`) → Register app → copy the `firebaseConfig` object.

Create `frontend/.env.local` (gitignored) with the four values from that object, plus the backend API URL:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:8080
```

`VITE_API_URL` must be set or API requests will fall through to the Vite dev server and fail.

## 4. Create the service account

Project settings → **Service accounts** → **Generate new private key** → download the JSON file.

This file is passed to the web service via the `FIREBASE_SERVICE_ACCOUNT` environment variable (see [Local Development](../README.md#2-run-the-web-service)).

## 5. Authorize domains

Authentication → Settings → **Authorized domains**:

| Environment | Domain to add |
|:------------|:--------------|
| Local dev | `localhost` |
| Render | your Render static site domain (e.g. `jobhunt-frontend.onrender.com`) |