export interface Player {
  id: string;
  name: string;
  ac: number;
  hp: number;
  currentHp: number;
  initiative: number;
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

