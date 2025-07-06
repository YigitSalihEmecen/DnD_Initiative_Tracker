import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { safeLocalStorageGetItem, safeLocalStorageSetItem, safeLocalStorageRemoveItem } from './utils';
import type { Campaign, User, UserData, SaveFile, SyncStatus } from '@/types';

const SAVE_FILE_VERSION = '1.0.0';
const LOCAL_STORAGE_KEY = 'encounterFlowApp_campaigns_v2';
const LOCAL_USER_DATA_KEY = 'encounterFlowApp_userData';
const LOCAL_SYNC_STATUS_KEY = 'encounterFlowApp_syncStatus';

// Platform detection for metadata
const getPlatform = (): 'web' | 'webview' | 'mobile' => {
  if (typeof window === 'undefined') return 'web';
  
  const userAgent = window.navigator.userAgent;
  if (/WebView|wv|Android.*Version.*Chrome|iPhone.*Mobile.*Safari/i.test(userAgent)) {
    return 'webview';
  }
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    return 'mobile';
  }
  return 'web';
};

// Generate device ID for tracking
const getDeviceId = (): string => {
  const stored = safeLocalStorageGetItem('encounterFlow_deviceId');
  if (stored) return stored;
  
  const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  safeLocalStorageSetItem('encounterFlow_deviceId', newId);
  return newId;
};

export class DataSyncService {
  private user: User | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private syncStatus: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
    lastSync: null,
    isSyncing: false,
    hasLocalChanges: false,
    syncError: null,
  };

  constructor() {
    // Monitor online status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateOnlineStatus(true));
      window.addEventListener('offline', () => this.updateOnlineStatus(false));
    }
    
    // Load sync status from localStorage
    this.loadSyncStatus();
  }

  // Set current user and start syncing
  setUser(user: User | null) {
    if (this.user?.uid !== user?.uid) {
      this.stopSync();
      this.user = user;
      if (user) {
        this.startSync();
      }
    }
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Load campaigns from local storage
  loadLocalCampaigns(): Campaign[] {
    try {
      const stored = safeLocalStorageGetItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const campaigns = JSON.parse(stored);
        if (Array.isArray(campaigns)) {
          return campaigns;
        }
      }
    } catch (error) {
      console.error('Error loading local campaigns:', error);
    }
    return [];
  }

  // Save campaigns to local storage
  saveLocalCampaigns(campaigns: Campaign[]): boolean {
    try {
      const success = safeLocalStorageSetItem(LOCAL_STORAGE_KEY, JSON.stringify(campaigns));
      if (success) {
        this.updateSyncStatus({ hasLocalChanges: true });
      }
      return success;
    } catch (error) {
      console.error('Error saving local campaigns:', error);
      return false;
    }
  }

  // Create save file structure
  private createSaveFile(campaigns: Campaign[]): SaveFile {
    if (!this.user) {
      throw new Error('No user logged in');
    }

    return {
      version: SAVE_FILE_VERSION,
      userData: {
        uid: this.user.uid,
        email: this.user.email,
        displayName: this.user.displayName,
        campaigns: campaigns,
        lastSync: Date.now(),
        createdAt: Date.now(),
      },
      metadata: {
        deviceId: getDeviceId(),
        appVersion: SAVE_FILE_VERSION,
        lastLocalSave: Date.now(),
        platform: getPlatform(),
      },
    };
  }

  // Sync campaigns to cloud
  async syncToCloud(campaigns: Campaign[]): Promise<boolean> {
    if (!this.user || !this.syncStatus.isOnline || !db) {
      return false;
    }

    this.updateSyncStatus({ isSyncing: true, syncError: null });

    try {
      const saveFile = this.createSaveFile(campaigns);
      const userDocRef = doc(db, 'users', this.user.uid);
      
      await setDoc(userDocRef, {
        ...saveFile.userData,
        lastSync: serverTimestamp(),
        metadata: saveFile.metadata,
      }, { merge: true });

      this.updateSyncStatus({ 
        lastSync: Date.now(), 
        hasLocalChanges: false,
        isSyncing: false 
      });
      
      return true;
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      this.updateSyncStatus({ 
        isSyncing: false, 
        syncError: error instanceof Error ? error.message : 'Sync failed' 
      });
      return false;
    }
  }

  // Load campaigns from cloud
  async loadFromCloud(): Promise<Campaign[]> {
    if (!this.user || !this.syncStatus.isOnline || !db) {
      return this.loadLocalCampaigns();
    }

    try {
      const userDocRef = doc(db, 'users', this.user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data() as UserData;
        
        // Update sync status
        this.updateSyncStatus({ 
          lastSync: Date.now(),
          syncError: null 
        });

        // Save to local storage as backup
        if (userData.campaigns && Array.isArray(userData.campaigns)) {
          this.saveLocalCampaigns(userData.campaigns);
          this.updateSyncStatus({ hasLocalChanges: false });
          return userData.campaigns;
        }
      }
    } catch (error) {
      console.error('Error loading from cloud:', error);
      this.updateSyncStatus({ 
        syncError: error instanceof Error ? error.message : 'Load failed' 
      });
    }
    
    // Fallback to local storage
    return this.loadLocalCampaigns();
  }

  // Start real-time sync listener
  private startSync() {
    if (!this.user || !db) return;

    const userDocRef = doc(db, 'users', this.user.uid);
    this.unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data() as UserData;
        if (userData.campaigns) {
          // Update local storage with cloud data
          this.saveLocalCampaigns(userData.campaigns);
          this.updateSyncStatus({ 
            lastSync: Date.now(),
            hasLocalChanges: false 
          });
        }
      }
    }, (error) => {
      console.error('Error in sync listener:', error);
      this.updateSyncStatus({ 
        syncError: error.message 
      });
    });
  }

  // Stop sync listener
  private stopSync() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Update online status
  private updateOnlineStatus(isOnline: boolean) {
    this.updateSyncStatus({ isOnline });
    
    // Auto-sync when coming back online
    if (isOnline && this.syncStatus.hasLocalChanges) {
      const campaigns = this.loadLocalCampaigns();
      this.syncToCloud(campaigns);
    }
  }

  // Update sync status
  private updateSyncStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.saveSyncStatus();
  }

  // Load sync status from localStorage
  private loadSyncStatus() {
    try {
      const stored = safeLocalStorageGetItem(LOCAL_SYNC_STATUS_KEY);
      if (stored) {
        const status = JSON.parse(stored);
        this.syncStatus = { ...this.syncStatus, ...status };
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  }

  // Save sync status to localStorage
  private saveSyncStatus() {
    try {
      safeLocalStorageSetItem(LOCAL_SYNC_STATUS_KEY, JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('Error saving sync status:', error);
    }
  }

  // Cleanup
  destroy() {
    this.stopSync();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.updateOnlineStatus(true));
      window.removeEventListener('offline', () => this.updateOnlineStatus(false));
    }
  }
}

// Singleton instance
export const dataSyncService = new DataSyncService(); 