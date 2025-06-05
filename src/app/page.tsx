'use client';

import { useState, useEffect } from 'react';
import type { Campaign } from '@/types';
import CampaignManagerComponent from '@/components/CampaignManager';
import EncounterManager from '@/components/EncounterManager';
import ActiveEncounter from '@/components/ActiveEncounter';
import { generateId } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { dataSyncService } from '@/lib/dataSync';

const LOCAL_STORAGE_KEY_CAMPAIGNS = 'encounterFlowApp_campaigns_v2';

export default function Home() {
  const { user, loading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load campaigns when component mounts or user changes
  useEffect(() => {
    if (isClient && !loading) {
      loadCampaigns();
    }
  }, [isClient, loading, user]);

  // Save campaigns whenever they change
  useEffect(() => {
    if (isClient && campaigns.length > 0) {
      saveCampaigns();
    }
  }, [campaigns, isClient]);

  const loadCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      let loadedCampaigns: Campaign[] = [];
      
      if (user) {
        // Load from cloud for logged-in users
        loadedCampaigns = await dataSyncService.loadFromCloud();
      } else {
        // Load from local storage for anonymous users
        loadedCampaigns = dataSyncService.loadLocalCampaigns();
      }

      // Validate and sanitize data
      const validCampaigns = loadedCampaigns.map((camp: any) => ({
        ...camp,
        lastModified: camp.lastModified || Date.now(),
        encounters: (camp.encounters || []).map((enc: any) => ({
          ...enc,
          lastModified: enc.lastModified || Date.now(),
          createdDate: enc.createdDate || enc.lastModified || Date.now(),
          isFinished: enc.isFinished || false,
        })).sort((a: any, b: any) => b.lastModified - a.lastModified)
      })).filter(camp =>
        typeof camp.id === 'string' &&
        typeof camp.name === 'string' &&
        typeof camp.lastModified === 'number' &&
        Array.isArray(camp.encounters)
      ).sort((a, b) => b.lastModified - a.lastModified);

      setCampaigns(validCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      // Fallback to empty array
      setCampaigns([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const saveCampaigns = async () => {
    try {
      if (user) {
        // Save to cloud for logged-in users
        await dataSyncService.syncToCloud(campaigns);
      } else {
        // Save to local storage for anonymous users
        dataSyncService.saveLocalCampaigns(campaigns);
      }
    } catch (error) {
      console.error('Error saving campaigns:', error);
    }
  };

  const handleCreateCampaign = (name: string): string => {
    const newCampaign: Campaign = {
      id: generateId(),
      name: name || `Campaign ${campaigns.length + 1}`,
      encounters: [],
      lastModified: Date.now(),
    };
    setCampaigns(prev => [newCampaign, ...prev].sort((a,b) => b.lastModified - a.lastModified));
    return newCampaign.id;
  };

  const handleUpdateCampaign = (updatedCampaign: Campaign) => {
    const campaignWithSortedEncounters = {
      ...updatedCampaign,
      encounters: [...updatedCampaign.encounters].sort((a, b) => b.lastModified - a.lastModified),
      lastModified: Date.now() 
    };

    setCampaigns(prevCampaigns =>
      prevCampaigns.map(camp =>
        camp.id === campaignWithSortedEncounters.id ? campaignWithSortedEncounters : camp
      ).sort((a, b) => b.lastModified - a.lastModified)
    );
  };

  const handleDeleteCampaign = (campaignId: string) => {
    const campaignToDelete = campaigns.find(c => c.id === campaignId);
    if (!campaignToDelete) {
      return;
    }

    setCampaigns(prev => prev.filter(camp => camp.id !== campaignId));
    if (activeCampaignId === campaignId) {
      setActiveCampaignId(null);
      setActiveEncounterId(null);
    }
  };
  
  const handleDeleteAllCampaigns = () => {
    setCampaigns([]);
    setActiveCampaignId(null);
    setActiveEncounterId(null);
  };

  const handleSelectCampaign = (campaignId: string) => {
    setActiveCampaignId(campaignId);
    setActiveEncounterId(null); 
    
    setCampaigns(prevCampaigns =>
      prevCampaigns.map(camp =>
        camp.id === campaignId ? { ...camp, lastModified: Date.now() } : camp
      ).sort((a, b) => b.lastModified - a.lastModified)
    );
  };

  const handleExitCampaign = () => {
    setActiveCampaignId(null);
    setActiveEncounterId(null);
  };

  const handleSelectEncounter = (encounterId: string) => {
    setActiveEncounterId(encounterId);
    if (activeCampaignId) {
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(camp => {
          if (camp.id === activeCampaignId) {
            // Ensure we're working with the most up-to-date encounters list for this campaign
            const currentCampaignData = prevCampaigns.find(c => c.id === activeCampaignId);
            const updatedEncounters = [...(currentCampaignData?.encounters || [])].sort((a, b) => b.lastModified - a.lastModified);
            return { ...camp, encounters: updatedEncounters, lastModified: Date.now() };
          }
          return camp;
        }).sort((a, b) => b.lastModified - a.lastModified)
      );
    }
  };

  const handleExitEncounter = () => {
    setActiveEncounterId(null);
    if (activeCampaignId) {
        setCampaigns(prevCampaigns => 
          prevCampaigns.map(camp => 
            camp.id === activeCampaignId ? { ...camp, lastModified: Date.now() } : camp
          ).sort((a, b) => b.lastModified - a.lastModified)
        );
    }
  };

  const activeCampaign = campaigns.find(camp => camp.id === activeCampaignId);
  const activeEncounter = activeCampaign?.encounters.find(enc => enc.id === activeEncounterId);

  if (!isClient || loading || isLoadingCampaigns) {
    return (
      <main className="flex-grow container mx-auto p-4 md:p-8 font-code flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">
            {loading ? 'Loading EncounterFlow...' : isLoadingCampaigns ? 'Syncing campaigns...' : 'Loading EncounterFlow...'}
          </p>
        </div>
      </main>
    );
  }

  if (!activeCampaign) {
    return (
      <CampaignManagerComponent
        campaigns={campaigns}
        onCreateCampaign={handleCreateCampaign}
        onSelectCampaign={handleSelectCampaign}
        onDeleteCampaign={handleDeleteCampaign}
        onDeleteAllCampaigns={handleDeleteAllCampaigns}
        onUpdateCampaign={handleUpdateCampaign}
        user={user}
      />
    );
  }

  if (!activeEncounter) {
    return (
      <EncounterManager
        campaign={activeCampaign}
        onCampaignUpdate={handleUpdateCampaign}
        onSelectEncounter={handleSelectEncounter}
        onExitCampaign={handleExitCampaign}
      />
    );
  }

  return (
    <ActiveEncounter
      key={activeEncounter.id} 
      encounter={activeEncounter}
      campaign={activeCampaign}
      onCampaignUpdate={handleUpdateCampaign} 
      onExitEncounter={handleExitEncounter}
    />
  );
}

