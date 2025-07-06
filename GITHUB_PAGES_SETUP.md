# GitHub Pages Deployment Setup

This guide explains how to deploy the D&D Initiative Tracker to GitHub Pages with Firebase authentication.

## Prerequisites

1. Firebase project with authentication enabled
2. GitHub repository with Pages enabled
3. Google Cloud Console access

## Step 1: Configure Firebase Console

### Add Authorized Domains

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your GitHub Pages domain:
   ```
   yigitsalihemecen.github.io
   ```

### Update OAuth Redirect URIs (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `encountertracker-13662`
3. Navigate to APIs & Services → Credentials
4. Edit your OAuth 2.0 client ID
5. Add to Authorized redirect URIs:
   ```
   https://yigitsalihemecen.github.io/__/auth/handler
   https://yigitsalihemecen.github.io/D-D-Initiative-Tracker/__/auth/handler
   ```

## Step 2: Set GitHub Repository Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following Repository secrets:

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyD0Jw9TdyBMUVwfHLyTHE09dNZkVFn7yrI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = encountertracker-13662.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = encountertracker-13662
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = encountertracker-13662.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 975572155272
NEXT_PUBLIC_FIREBASE_APP_ID = 1:975572155272:web:57fdbde866e8ff83ae8b9b
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = G-9XZTDK90WF
```

## Step 3: Enable GitHub Pages

1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The deployment will automatically trigger on pushes to master

## Step 4: Verify Deployment

1. Push changes to master branch
2. Check Actions tab for deployment status
3. Visit: `https://yigitsalihemecen.github.io/D-D-Initiative-Tracker/`
4. Test Google Sign-In functionality

## Troubleshooting

### Authentication Issues

- **"redirect_uri_mismatch"**: Check OAuth redirect URIs in Google Cloud Console
- **"unauthorized_client"**: Verify authorized domains in Firebase Console
- **Environment variables not working**: Check GitHub Secrets are properly set

### Build Issues

- Check GitHub Actions logs in the Actions tab
- Verify all dependencies are properly installed
- Ensure Firebase configuration is valid

### Local Development

For local development, create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD0Jw9TdyBMUVwfHLyTHE09dNZkVFn7yrI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=encountertracker-13662.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=encountertracker-13662
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=encountertracker-13662.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=975572155272
NEXT_PUBLIC_FIREBASE_APP_ID=1:975572155272:web:57fdbde866e8ff83ae8b9b
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-9XZTDK90WF
```

## What Changed

### 1. `next.config.mjs`
- Fixed basePath to match repository name
- Added environment variable embedding for static builds
- Fallback Firebase credentials for build-time

### 2. `.github/workflows/deploy.yml`
- Added Firebase environment variables from GitHub Secrets
- Proper build environment setup

### 3. `src/lib/firebase.ts`
- Enhanced environment detection (GitHub Pages vs localhost)
- Better Firebase configuration validation
- Real Firebase credentials with fallbacks
- Improved logging for debugging

## Security Notes

- Firebase API keys are safe to expose publicly (they identify your project)
- Actual security is enforced by Firebase Security Rules and OAuth configuration
- GitHub Secrets are encrypted and only accessible during builds 