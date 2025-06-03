'use client';

import type { Encounter } from '@/types';
import { useState, type FormEvent, useEffect }from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, PlayCircle, Trash2, Edit3, ListChecks } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

interface EncounterManagerProps {
  encounters: Encounter[];
  onCreateEncounter: (name: string) => string;
  onSelectEncounter: (id: string) => void;
  onDeleteEncounter: (id: string) => void;
}

export default function EncounterManager({
  encounters,
  onCreateEncounter,
  onSelectEncounter,
  onDeleteEncounter,
}: EncounterManagerProps) {
  const [newEncounterName, setNewEncounterName] = useState('');
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newEncounterName.trim()) {
      toast({
        title: "Encounter Name Required",
        description: "Please enter a name for the new encounter.",
        variant: "destructive",
      });
      return;
    }
    const newId = onCreateEncounter(newEncounterName);
    toast({
      title: "Encounter Created",
      description: `"${newEncounterName}" is ready for setup.`,
    });
    onSelectEncounter(newId); 
    setNewEncounterName('');
  };
  
  const getStageDisplay = (stage: string) => {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  if (!isClient) {
     return (
      <div className="container mx-auto p-4 md:p-8 font-code flex justify-center items-center min-h-[calc(100vh-10rem)]">
        {/* Minimal loading state to avoid flash of unstyled content or hydration errors on initial load */}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in font-code">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-headline font-bold tracking-tight">EncounterFlow</h1>
        <p className="text-xl text-muted-foreground mt-2">Your D&amp;D Encounter Command Center</p>
      </header>
      
      <Card className="shadow-xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline text-primary">
            <FilePlus size={32} /> Create New Encounter
          </CardTitle>
          <CardDescription className="text-base">Launch a new adventure. Give it a name to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSubmit} className="flex flex-col sm:flex-row gap-4 items-stretch">
            <Input
              type="text"
              value={newEncounterName}
              onChange={(e) => setNewEncounterName(e.target.value)}
              placeholder="e.g., The Dragon's Lair"
              className="flex-grow text-lg p-3 h-12"
              aria-label="New Encounter Name"
            />
            <Button type="submit" size="lg" className="h-12 text-lg px-8">
              <Edit3 className="mr-2" /> Create & Setup
            </Button>
          </form>
        </CardContent>
      </Card>

      {encounters.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                <ListChecks size={32} /> Ongoing Encounters
            </CardTitle>
            <CardDescription className="text-base">Jump back into the action or manage your saved scenarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {encounters.map((encounter) => (
              <Card key={encounter.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:shadow-md transition-shadow duration-200">
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-primary">{encounter.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {encounter.players.length} combatant{encounter.players.length === 1 ? '' : 's'} &bull; Stage: {getStageDisplay(encounter.stage)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {formatDistanceToNow(new Date(encounter.lastModified), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                  <Button onClick={() => onSelectEncounter(encounter.id)} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                    <PlayCircle className="mr-2" /> Continue
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${encounter.name}"? This cannot be undone.`)) {
                        onDeleteEncounter(encounter.id);
                        toast({ title: "Encounter Deleted", description: `"${encounter.name}" has been removed.` });
                      }
                    }}
                    variant="destructive"
                    size="sm"
                    aria-label={`Delete ${encounter.name}`}
                  >
                    <Trash2 className="mr-1.5" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
       {encounters.length === 0 && (
        <Card className="shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">No Encounters Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-lg">It's quiet here... too quiet.</p>
            <p className="text-muted-foreground mt-1">Create your first encounter above to get started!</p>
            <img data-ai-hint="empty chest treasure" src="https://placehold.co/300x200.png" alt="Empty chest illustration" className="mx-auto mt-6 rounded-md opacity-70" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
