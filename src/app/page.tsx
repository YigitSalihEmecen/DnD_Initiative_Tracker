
'use client';

import { useState, useEffect } from 'react';
import type { Campaign, Encounter, Player, AppStage, EncounterType } from '@/types';
import CampaignManagerComponent from '@/components/CampaignManager';
import EncounterManager from '@/components/EncounterManager';
import ActiveEncounter from '@/components/ActiveEncounter';
import { useToast } from "@/hooks/use-toast";

const LOCAL_STORAGE_KEY_CAMPAIGNS = 'encounterFlowApp_campaigns_v2';

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const storedCampaigns = localStorage.getItem(LOCAL_STORAGE_KEY_CAMPAIGNS);
      if (storedCampaigns) {
        try {
          const parsedCampaigns: Campaign[] = JSON.parse(storedCampaigns).map((camp: any) => ({
            ...camp,
            lastModified: camp.lastModified || Date.now(),
            encounters: (camp.encounters || []).map((enc: any) => ({
              ...enc,
              type: enc.type || 'local',
              lastModified: enc.lastModified || Date.now()
            })).sort((a: Encounter, b: Encounter) => b.lastModified - a.lastModified)
          }));

          if (Array.isArray(parsedCampaigns) && parsedCampaigns.every(camp =>
              typeof camp.id === 'string' &&
              typeof camp.name === 'string' &&
              typeof camp.lastModified === 'number' &&
              Array.isArray(camp.encounters)
            )) {
            setCampaigns(parsedCampaigns.sort((a,b) => b.lastModified - a.lastModified));
          } else {
            console.warn("Stored campaigns data is malformed. Resetting.");
            localStorage.removeItem(LOCAL_STORAGE_KEY_CAMPAIGNS);
            setCampaigns([]);
            toast({
              title: "Data Issue",
              description: "Saved campaign data was malformed and has been reset.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to parse campaigns from localStorage", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY_CAMPAIGNS);
          setCampaigns([]);
          toast({
            title: "Error Loading Data",
            description: "Could not load saved campaigns. Please try refreshing.",
            variant: "destructive",
          });
        }
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
      } catch (error) {
        console.error("Failed to save campaigns to localStorage", error);
         toast({
            title: "Error Saving Data",
            description: "Could not save campaigns. Changes might not persist.",
            variant: "destructive",
          });
      }
    }
  }, [campaigns, isClient]);

  const handleCreateCampaign = (name: string): string => {
    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      name: name || `Campaign ${campaigns.length + 1}`,
      encounters: [],
      lastModified: Date.now(),
    };
    setCampaigns(prev => [newCampaign, ...prev].sort((a,b) => b.lastModified - a.lastModified));
    toast({ title: "Campaign Created", description: `"${newCampaign.name}" is ready.` });
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
      toast({ title: "Deletion Failed", description: "Campaign not found.", variant: "destructive" });
      return;
    }
    setCampaigns(prev => prev.filter(camp => camp.id !== campaignId));
    if (activeCampaignId === campaignId) {
      setActiveCampaignId(null);
      setActiveEncounterId(null);
    }
    toast({ title: "Campaign Deleted", description: `"${campaignToDelete.name}" has been removed.` });
  };
  
  const handleDeleteAllCampaigns = () => {
    setCampaigns([]);
    setActiveCampaignId(null);
    setActiveEncounterId(null);
    toast({ title: "All Campaigns Deleted", description: "All saved campaigns have been removed." });
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
    // When an encounter is selected (either newly created or existing from a list),
    // update its parent campaign's lastModified timestamp to bring it to the top of the sorted list.
    if (activeCampaignId) {
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(camp => 
          camp.id === activeCampaignId ? { ...camp, lastModified: Date.now() } : camp
        ).sort((a, b) => b.lastModified - a.lastModified)
      );
    }
  };

  const handleExitEncounter = () => {
    setActiveEncounterId(null);
    if (activeCampaignId) {
        const campaign = campaigns.find(c => c.id === activeCampaignId);
        if (campaign) {
            // Touch the campaign to update its lastModified when exiting an encounter
             setCampaigns(prevCampaigns => 
              prevCampaigns.map(camp => 
                camp.id === activeCampaignId ? { ...camp, lastModified: Date.now() } : camp
              ).sort((a, b) => b.lastModified - a.lastModified)
            );
        }
    }
  };

  const activeCampaign = campaigns.find(camp => camp.id === activeCampaignId);
  const activeEncounter = activeCampaign?.encounters.find(enc => enc.id === activeEncounterId);

  if (!isClient) {
    return (
      <main className="flex-grow container mx-auto p-4 md:p-8 font-code flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Loading EncounterFlow...</p>
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
