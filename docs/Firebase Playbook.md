# Firebase Playbook

One-time setup steps for the Firebase project. These only need to be done once per Firebase project.

## 1. Create the project

Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (or select an existing one).

## 2. Enable Google Sign-In

Authentication → Sign-in method → Google → **Enable** → Save.

## 3. Register the web app

Project settings (⚙️) → Your apps → **Add app** → Web (`</>`) → Register app → copy the `firebaseConfig` object.

Create `frontend/.env.local` (gitignored) with the four values from that object:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_APP_ID=...
```

## 4. Create the service account

Project settings → **Service accounts** → **Generate new private key** → download the JSON file.

This file is passed to the web service via the `FIREBASE_SERVICE_ACCOUNT` environment variable (see [Local Development](../README.md#2-run-the-web-service)).

## 5. Authorize domains

Authentication → Settings → **Authorized domains**:

| Environment | Domain to add |
|:------------|:--------------|
| Local dev | `localhost` |
| Render | your Render static site domain (e.g. `jobhunt-frontend.onrender.com`) |

## Render deployment

Set the following secrets in the Render dashboard under Environment Variables:

| Service | Variable | Value |
|:--------|:---------|:------|
| `jobhunt-api` | `FIREBASE_SERVICE_ACCOUNT` | Full contents of the service account JSON file |
| `jobhunt-frontend` | `VITE_FIREBASE_API_KEY` | From Firebase web app config |
| `jobhunt-frontend` | `VITE_FIREBASE_AUTH_DOMAIN` | From Firebase web app config |
| `jobhunt-frontend` | `VITE_FIREBASE_PROJECT_ID` | From Firebase web app config |
| `jobhunt-frontend` | `VITE_FIREBASE_APP_ID` | From Firebase web app config |

> `VITE_*` vars are baked into the static bundle at build time — a redeploy is required if they change.
