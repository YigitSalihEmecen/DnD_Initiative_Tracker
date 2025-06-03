export interface Player {
  id: string;
  name: string;
  ac: number;
  hp: number;
  initiative: number; // Initiative will be set, default to 0 or handle undefined
  currentHp: number;
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
  lastModified: number; // Timestamp
}
