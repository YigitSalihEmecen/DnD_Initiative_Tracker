export interface Player {
  id: string;
  name: string;
  ac: number;
  hp: number;
  currentHp: number;
  initiative: number;
  originalMonster?: Monster; // Store original monster data for bestiary creatures
}

export type AppStage =
  | 'PLAYER_SETUP'
  | 'INITIATIVE_SETUP'
  | 'PRE_COMBAT'
  | 'COMBAT_ACTIVE';

export interface Encounter {
  id: string;
  name: string;
  players: Player[];
  stage: AppStage;
  createdDate: number;
  lastModified: number;
  isFinished: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  encounters: Encounter[];
  lastModified: number;
}

// User and Authentication Types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

// Cloud Storage Structure
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  campaigns: Campaign[];
  lastSync: number;
  createdAt: number;
}

// Save File Structure for Cloud Storage
export interface SaveFile {
  version: string;
  userData: UserData;
  metadata: {
    deviceId?: string;
    appVersion?: string;
    lastLocalSave: number;
    platform: 'web' | 'webview' | 'mobile';
  };
}

// Sync Status for data management
export interface SyncStatus {
  isOnline: boolean;
  lastSync: number | null;
  isSyncing: boolean;
  hasLocalChanges: boolean;
  syncError: string | null;
}

export interface Monster {
  name: string;
  source: string;
  size: string[];
  type: string | { type: string; tags?: string[] };
  alignment: string[];
  ac: number | number[] | { ac: number; from: string[] }[];
  hp: { average: number; formula: string };
  speed?: { [key: string]: number };
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  cr: string | { cr: string; lair?: string };
  passive?: number;
  languages?: string[];
  skill?: { [key: string]: string };
  save?: { [key: string]: string };
  trait?: Array<{ name: string; entries: string[] }>;
  action?: Array<{ name: string; entries: string[] }>;
  environment?: string[];
}

