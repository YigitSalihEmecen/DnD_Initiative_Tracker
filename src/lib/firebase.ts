import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD0Jw9TdyBMUVwfHLyTHE09dNZkVFn7yrI',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'encountertracker-13662.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'encountertracker-13662',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'encountertracker-13662.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '975572155272',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:975572155272:web:57fdbde866e8ff83ae8b9b',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-9XZTDK90WF'
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.projectId &&
         firebaseConfig.apiKey.startsWith('AIza');
};

// Initialize Firebase only if it hasn't been initialized yet and only in browser environment
let app: any = null;
let auth: any = null;
let db: any = null;
let analytics: Analytics | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== 'undefined') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Firebase services only if Firebase is properly configured
    if (isFirebaseConfigured()) {
      auth = getAuth(app);
      db = getFirestore(app);
      
      // Initialize Analytics (only in browser and when Firebase is configured)
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn('Analytics initialization failed:', error);
      }
      
      // Google Auth Provider
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Firebase initialized successfully');
    } else {
      console.warn('Firebase not properly configured, running in offline mode');
    }
  } catch (error) {
    console.warn('Firebase initialization failed, running in offline mode:', error);
  }
}

export { auth, db, analytics, googleProvider, isFirebaseConfigured };
export default app; 