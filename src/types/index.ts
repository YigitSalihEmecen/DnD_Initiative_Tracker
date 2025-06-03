
export interface Player {
  id: string;
  name: string;
  ac: number;
  hp: number;
  initiative: number;
  currentHp: number;
}

export type AppStage =
  | 'PLAYER_SETUP'
  | 'INITIATIVE_SETUP'
  | 'PRE_COMBAT'
  | 'COMBAT_ACTIVE';

export type EncounterType = 'local' | 'online';

export interface Encounter {
  id: string;
  name: string;
  players: Player[];
  stage: AppStage;
  lastModified: number;
  createdDate: number; // Added this field
  type: EncounterType;
}

export interface Campaign {
  id: string;
  name: string;
  encounters: Encounter[];
  lastModified: number;
}
