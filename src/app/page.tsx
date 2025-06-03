
'use client';

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Encounter, Player, AppStage } from '@/types';
import EncounterManager from '@/components/EncounterManager';
import ActiveEncounter from '@/components/ActiveEncounter';
import { useToast } from "@/hooks/use-toast"; // Added useToast

const LOCAL_STORAGE_KEY = 'encounterFlowApp_encounters_v1';

export default function Home() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const storedEncounters = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEncounters) {
        try {
          const parsedEncounters: Encounter[] = JSON.parse(storedEncounters);
          if (Array.isArray(parsedEncounters) && parsedEncounters.every(enc => typeof enc.id === 'string' && typeof enc.name === 'string' && typeof enc.lastModified === 'number')) {
            setEncounters(parsedEncounters.sort((a,b) => b.lastModified - a.lastModified));
          } else {
            console.warn("Stored encounters data is malformed. Resetting.");
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear malformed data
            setEncounters([]);
          }
        } catch (error) {
          console.error("Failed to parse encounters from localStorage", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear malformed data on error
          setEncounters([]);
          toast({
            title: "Error Loading Data",
            description: "Could not load saved encounters. Please try refreshing.",
            variant: "destructive",
          });
        }
      }
    }
  }, [isClient, toast]); // Added toast to dependency array if used within this effect for error reporting

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(encounters));
      } catch (error) {
        console.error("Failed to save encounters to localStorage", error);
        toast({
          title: "Error Saving Data",
          description: "Could not save encounter changes automatically.",
          variant: "destructive",
        });
      }
    }
  }, [encounters, isClient, toast]); // Added toast to dependency array

  const handleCreateEncounter = (name: string): string => {
    const newEncounter: Encounter = {
      id: crypto.randomUUID(),
      name: name || `Encounter ${encounters.length + 1}`,
      players: [],
      stage: 'PLAYER_SETUP',
      lastModified: Date.now(),
    };
    setEncounters(prev => [newEncounter, ...prev].sort((a,b) => b.lastModified - a.lastModified));
    // Toast for creation is handled in EncounterManager and then onSelectEncounter
    return newEncounter.id;
  };

  const handleUpdateEncounter = (updatedEncounter: Encounter) => {
    setEncounters(prev =>
      prev.map(enc =>
        enc.id === updatedEncounter.id ? { ...updatedEncounter, lastModified: Date.now() } : enc
      ).sort((a,b) => b.lastModified - a.lastModified)
    );
  };

  const handleDeleteEncounter = (encounterId: string) => {
    try {
      const encounterToDelete = encounters.find(enc => enc.id === encounterId);
      if (!encounterToDelete) {
        toast({
          title: "Deletion Failed",
          description: "Encounter not found.",
          variant: "destructive",
        });
        return;
      }

      setEncounters(prev => prev.filter(enc => enc.id !== encounterId));
      
      if (activeEncounterId === encounterId) {
        setActiveEncounterId(null);
      }
      toast({
        title: "Encounter Deleted",
        description: `"${encounterToDelete.name}" has been removed.`,
      });
    } catch (error) {
      console.error("Error during encounter deletion:", error);
      toast({
        title: "Deletion Error",
        description: "An unexpected error occurred while deleting the encounter.",
        variant: "destructive",
      });
    }
  };

  const handleSelectEncounter = (encounterId: string) => {
    setActiveEncounterId(encounterId);
     setEncounters(prev => prev.map(e => e.id === encounterId ? {...e, lastModified: Date.now()} : e).sort((a,b) => b.lastModified - a.lastModified));
  };

  const handleExitEncounter = () => {
    setActiveEncounterId(null);
  };

  const activeEncounter = encounters.find(enc => enc.id === activeEncounterId);

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

  return (
    <main className="flex-grow">
      {!activeEncounter ? (
        <EncounterManager
          encounters={encounters}
          onCreateEncounter={handleCreateEncounter}
          onSelectEncounter={handleSelectEncounter}
          onDeleteEncounter={handleDeleteEncounter}
        />
      ) : (
        <ActiveEncounter
          key={activeEncounter.id} // Key is important here for re-mounts when activeEncounter changes
          encounter={activeEncounter}
          onEncounterUpdate={handleUpdateEncounter}
          onExitEncounter={handleExitEncounter}
        />
      )}
    </main>
  );
}
