import { logEvent, Analytics } from 'firebase/analytics';
import { analytics } from './firebase';

// Analytics event tracking utility
export const trackEvent = (eventName: string, parameters?: { [key: string]: any }) => {
  if (analytics && typeof window !== 'undefined') {
    try {
      logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.warn('Failed to track event:', eventName, error);
    }
  }
};

// Common app events
export const trackCampaignCreated = (campaignId: string) => {
  trackEvent('campaign_created', { campaign_id: campaignId });
};

export const trackEncounterStarted = (encounterId: string, participantCount: number) => {
  trackEvent('encounter_started', { 
    encounter_id: encounterId,
    participant_count: participantCount 
  });
};

export const trackBestiarySearch = (searchTerm: string, resultCount: number) => {
  trackEvent('bestiary_search', { 
    search_term: searchTerm,
    result_count: resultCount 
  });
};

export const trackMonsterAdded = (monsterId: string, monsterType: string) => {
  trackEvent('monster_added', { 
    monster_id: monsterId,
    monster_type: monsterType 
  });
};

export const trackUserSignIn = (method: string) => {
  trackEvent('login', { method });
};

export const trackUserSignOut = () => {
  trackEvent('logout');
}; 