import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import type { User } from '@/types';

// Detect if we're in a WebView environment
export const isWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const navigator = window.navigator as any;
  return /WebView|wv|Android.*Version.*Chrome|iPhone.*Mobile.*Safari/i.test(userAgent) ||
         navigator.standalone === true ||
         (window as any).chrome === undefined;
};

// Convert Firebase User to our User type
export const convertFirebaseUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    isAnonymous: firebaseUser.isAnonymous,
  };
};

// Sign in with Google - WebView compatible
export const signInWithGoogle = async (): Promise<User | null> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }

  try {
    if (isWebView()) {
      // Use redirect for WebView compatibility
      await signInWithRedirect(auth, googleProvider);
      return null; // Will be handled by getRedirectResult
    } else {
      // Use popup for regular browsers
      const result = await signInWithPopup(auth, googleProvider);
      return convertFirebaseUser(result.user);
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Handle redirect result for WebView
export const handleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return convertFirebaseUser(result.user);
    }
    return null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    const user = convertFirebaseUser(firebaseUser);
    callback(user);
  });
};

// Get current user
export const getCurrentUser = (): User | null => {
  return convertFirebaseUser(auth.currentUser);
}; 