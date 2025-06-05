import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe UUID generation for WebView compatibility
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for WebView environments that don't support crypto.randomUUID
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Safe localStorage operations for WebView compatibility
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
      return true;
    }
  } catch (error) {
    console.warn('localStorage.setItem failed:', error);
  }
  return false;
}

export function safeLocalStorageGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch (error) {
    console.warn('localStorage.getItem failed:', error);
  }
  return null;
}

export function safeLocalStorageRemoveItem(key: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    console.warn('localStorage.removeItem failed:', error);
  }
  return false;
}
