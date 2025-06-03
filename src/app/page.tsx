'use client';

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Encounter, Player, AppStage } from '@/types';
import EncounterManager from '@/components/EncounterManager';
import ActiveEncounter from '@/components/ActiveEncounter';
// Toaster is already in layout.tsx, so it's not needed here.

const LOCAL_STORAGE_KEY = 'encounterFlowApp_encounters_v1'; // Added versioning to key

export default function Home() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Indicates component has mounted on client
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const storedEncounters = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEncounters) {
        try {
          const parsedEncounters: Encounter[] = JSON.parse(storedEncounters);
          // Basic validation for parsed data
          if (Array.isArray(parsedEncounters) && parsedEncounters.every(enc => typeof enc.id === 'string' && typeof enc.name === 'string')) {
            setEncounters(parsedEncounters.sort((a,b) => b.lastModified - a.lastModified));
          } else {
            console.warn("Stored encounters data is malformed. Resetting.");
            setEncounters([]);
          }
        } catch (error) {
          console.error("Failed to parse encounters from localStorage", error);
          setEncounters([]); // Reset to empty if parsing fails
        }
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(encounters));
    }
  }, [encounters, isClient]);

  const handleCreateEncounter = (name: string): string => {
    const newEncounter: Encounter = {
      id: crypto.randomUUID(),
      name: name || `Encounter ${encounters.length + 1}`,
      players: [],
      stage: 'PLAYER_SETUP',
      lastModified: Date.now(),
    };
    setEncounters(prev => [newEncounter, ...prev].sort((a,b) => b.lastModified - a.lastModified));
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
    setEncounters(prev => prev.filter(enc => enc.id !== encounterId));
    if (activeEncounterId === encounterId) {
      setActiveEncounterId(null);
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
        {/* <Toaster /> Removed from here */}
      </main>
    );
  }

  return (
    <main className="flex-grow"> {/* Removed container and padding, handled by children */}
      {!activeEncounter ? (
        <EncounterManager
          encounters={encounters}
          onCreateEncounter={handleCreateEncounter}
          onSelectEncounter={handleSelectEncounter}
          onDeleteEncounter={handleDeleteEncounter}
        />
      ) : (
        <ActiveEncounter
          key={activeEncounter.id}
          encounter={activeEncounter}
          onEncounterUpdate={handleUpdateEncounter}
          onExitEncounter={handleExitEncounter}
        />
      )}
      {/* <Toaster /> Removed from here */}
    </main>
  );
}
