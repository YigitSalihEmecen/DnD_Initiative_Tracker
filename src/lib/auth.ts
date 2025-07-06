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

// Enhanced WebView detection
export const isWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const navigator = window.navigator as any;
  
  // Check for common WebView indicators
  const webViewPatterns = [
    /WebView/i,
    /wv/,
    /Android.*Version.*Chrome/i,
    /iPhone.*Mobile.*Safari/i,
    /FB_IAB/i, // Facebook in-app browser
    /FBAN/i,   // Facebook app
    /FBAV/i,   // Facebook app
    /Instagram/i,
    /LinkedInApp/i,
    /TwitterAndroid/i,
    /Line/i,
    /KAKAOTALK/i,
    /YJApp/i,
    /Electron/i
  ];
  
  const isWebViewByUA = webViewPatterns.some(pattern => pattern.test(userAgent));
  const isStandalone = navigator.standalone === true;
  const isMissingChrome = typeof (window as any).chrome === 'undefined' && !userAgent.includes('Edge');
  
  return isWebViewByUA || isStandalone || (isMissingChrome && /Mobile/i.test(userAgent));
};

// Open system browser for authentication in WebView
export const openSystemBrowserAuth = (): void => {
  const authUrl = `${window.location.origin}?auth=google`;
  
  if (typeof window !== 'undefined') {
    // Try to open in system browser
    try {
      // For mobile apps, this will open the system browser
      window.open(authUrl, '_system');
    } catch (error) {
      // Fallback: try to open in new window/tab
      window.open(authUrl, '_blank');
    }
  }
};

// Check if we're in a WebView that supports redirect auth
export const supportsRedirectAuth = (): boolean => {
  if (!isWebView()) return true;
  
  // Some WebView implementations support redirect but not popup
  const userAgent = window.navigator.userAgent;
  return !/FB_IAB|FBAN|FBAV|Instagram|LinkedInApp/i.test(userAgent);
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

// Sign in with Google - WebView compatible with system browser fallback
export const signInWithGoogle = async (): Promise<User | null> => {
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }

  console.log('WebView detected:', isWebView());
  console.log('Supports redirect auth:', supportsRedirectAuth());

  try {
    if (isWebView()) {
      if (supportsRedirectAuth()) {
        console.log('Using redirect for WebView compatibility');
        // Use redirect for compatible WebView environments
        await signInWithRedirect(auth, googleProvider);
        return null; // Will be handled by getRedirectResult
      } else {
        console.log('WebView does not support OAuth - opening system browser');
        // For WebViews that don't support OAuth, open system browser
        openSystemBrowserAuth();
        throw new Error('Please complete authentication in the browser that just opened, then return to the app.');
      }
    } else {
      console.log('Using popup for regular browser');
      // Use popup for regular browsers
      const result = await signInWithPopup(auth, googleProvider);
      return convertFirebaseUser(result.user);
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // If popup is blocked or fails, try redirect as fallback
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.log('Popup blocked, trying redirect fallback');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error('Redirect also failed:', redirectError);
        throw new Error('Authentication failed. Please allow popups or try again.');
      }
    }
    
    throw error;
  }
};

// Handle redirect result for WebView
export const handleRedirectResult = async (): Promise<User | null> => {
  if (!auth) return null;
  
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Redirect authentication successful:', result.user.email);
      return convertFirebaseUser(result.user);
    }
    return null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    // Don't throw here, just return null
    return null;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  if (!auth) return;
  
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    // If Firebase isn't configured, call callback with null user immediately
    setTimeout(() => callback(null), 0);
    return () => {}; // Return empty unsubscribe function
  }
  
  return onAuthStateChanged(auth, (firebaseUser) => {
    const user = convertFirebaseUser(firebaseUser);
    callback(user);
  });
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (!auth) return null;
  return convertFirebaseUser(auth.currentUser);
}; 