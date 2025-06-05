# Firebase Setup Guide for EncounterFlow

This guide will help you set up Firebase for Google authentication and cloud storage in EncounterFlow.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "encounterflow-app")
4. Enable Google Analytics (optional)
5. Create the project

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the sidebar
2. Click on **Get started**
3. Go to the **Sign-in method** tab
4. Click on **Google** provider
5. Toggle **Enable**
6. Add your support email
7. Click **Save**

## 3. Enable Firestore Database

1. Go to **Firestore Database** in the sidebar
2. Click **Create database**
3. Choose **Start in test mode** (we'll secure it later)
4. Select your preferred location
5. Click **Done**

## 4. Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon next to "Project Overview")
2. Scroll down to **Your apps** section
3. Click on the **Web** icon `</>`
4. Register your app with a nickname (e.g., "EncounterFlow Web")
5. Copy the `firebaseConfig` object values

## 5. Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the placeholder values with your actual Firebase configuration values.

## 6. Set Up Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

## 7. Configure Authorized Domains (for Production)

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain (e.g., `yourapp.com`)
3. For development, `localhost` should already be included

## 8. WebView Configuration (for Android/iOS Apps)

If you're using this in a WebView app:

1. In **Authentication** → **Settings** → **Authorized domains**
2. Add any custom schemes your app uses
3. Consider using redirect-based sign-in for better WebView compatibility

## Testing

1. Start your development server: `npm run dev`
2. Navigate to the campaigns page
3. Click "Sign In with Google"
4. Complete the authentication flow
5. Verify that your campaigns sync to the cloud

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check that your API key is correct in `.env.local`
2. **"Unauthorized domain"**: Add your domain to authorized domains in Firebase
3. **"Permission denied"**: Check Firestore security rules
4. **WebView issues**: Use redirect flow instead of popup

### WebView Compatibility:

The app automatically detects WebView environments and uses redirect-based authentication instead of popups for better compatibility.

---

Once configured, EncounterFlow will automatically sync your campaigns across all devices where you're signed in! 