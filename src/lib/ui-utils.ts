import type { AppStage } from '@/types';

export const getStageBadgeClass = (stage?: AppStage): string => {
  switch (stage) {
    case 'PLAYER_SETUP':
      return 'border-sky-500 text-sky-500 bg-sky-500/10 hover:bg-sky-500/20';
    case 'INITIATIVE_SETUP':
      return 'border-amber-500 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20';
    case 'PRE_COMBAT':
      return 'border-yellow-500 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20';
    case 'COMBAT_ACTIVE':
      return 'border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20';
    default:
      return 'border-gray-400 text-gray-400 bg-gray-400/10 hover:bg-gray-400/20';
  }
}; 