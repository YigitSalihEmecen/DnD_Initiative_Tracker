
'use client';

import type { Encounter, EncounterType } from '@/types';
import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, PlayCircle, Trash2, Edit3, ListChecks } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface EncounterManagerProps {
  encounters: Encounter[];
  onCreateEncounter: (name: string, type: EncounterType) => string; // Returns new encounter ID
  onSelectEncounter: (id: string) => void;
  onDeleteEncounter: (id: string) => void;
  onDeleteAllEncounters: () => void;
}

export default function EncounterManager({
  encounters,
  onCreateEncounter,
  onSelectEncounter,
  onDeleteEncounter,
  onDeleteAllEncounters,
}: EncounterManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dialogEncounterName, setDialogEncounterName] = useState('');
  const [dialogEncounterType, setDialogEncounterType] = useState<EncounterType>('local');
  const [activeTab, setActiveTab] = useState<EncounterType>('local');
  
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenCreateDialog = () => {
    setDialogEncounterName('');
    setDialogEncounterType('local');
    setIsCreateDialogOpen(true);
  };

  const handleConfirmCreateEncounter = () => {
    if (!dialogEncounterName.trim()) {
      toast({
        title: "Encounter Name Required",
        description: "Please enter a name for the new encounter.",
        variant: "destructive",
      });
      return;
    }
    const newId = onCreateEncounter(dialogEncounterName, dialogEncounterType);
    onSelectEncounter(newId);
    toast({
      title: "Encounter Created",
      description: `"${dialogEncounterName}" (${dialogEncounterType}) is ready. Continuing...`,
    });
    setIsCreateDialogOpen(false);
  };
  
  const getStageDisplay = (stage?: string) => {
    if (!stage) return 'Unknown Stage';
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  const filteredEncounters = encounters.filter(
    (enc) => (enc.type || 'local') === activeTab
  );

  if (!isClient) {
     return (
      <div className="container mx-auto p-4 md:p-8 font-code flex justify-center items-center min-h-[calc(100vh-10rem)]">
        {/* Minimal loading state */}
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
          <CardDescription className="text-base">Launch a new adventure. Click below to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenCreateDialog} size="lg" className="h-12 text-lg px-8 w-full">
            <Edit3 className="mr-2" /> Create New Encounter
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Encounter Details</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a name and select the type for your new encounter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="e.g., The Goblin Ambush"
              value={dialogEncounterName}
              onChange={(e) => setDialogEncounterName(e.target.value)}
              aria-label="New Encounter Name"
              className="text-base p-3 h-12"
            />
            <RadioGroup value={dialogEncounterType} onValueChange={(value: string) => setDialogEncounterType(value as EncounterType)}>
              <Label className="mb-2 block">Encounter Type:</Label>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local" id="type-local" />
                <Label htmlFor="type-local">Local</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="type-online" />
                <Label htmlFor="type-online">Online (Future Feature)</Label>
              </div>
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateEncounter}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
              <ListChecks size={32} /> Ongoing Encounters
          </CardTitle>
          <CardDescription className="text-base">Jump back into the action or manage your saved scenarios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EncounterType)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="online">Online</TabsTrigger>
            </TabsList>
            <TabsContent value="local">
              {filteredEncounters.length > 0 ? (
                filteredEncounters.map((encounter) => (
                  <Card key={encounter.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:shadow-md transition-shadow duration-200 mb-3">
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-primary">{encounter.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {encounter.players.length} combatant{encounter.players.length === 1 ? '' : 's'} &bull; Stage: {getStageDisplay(encounter.stage)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {encounter.lastModified ? formatDistanceToNow(new Date(encounter.lastModified), { addSuffix: true }) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                      <Button onClick={() => onSelectEncounter(encounter.id)} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                        <PlayCircle className="mr-2" /> Continue
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={`Delete ${encounter.name}`}
                          >
                            <Trash2 className="mr-1.5" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this encounter?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the "{encounter.name}" encounter.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteEncounter(encounter.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))
              ) : (
                 <p className="text-muted-foreground text-center py-4">No local encounters yet. Create one to get started!</p>
              )}
            </TabsContent>
            <TabsContent value="online">
               {filteredEncounters.length > 0 ? (
                filteredEncounters.map((encounter) => (
                   <Card key={encounter.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:shadow-md transition-shadow duration-200 mb-3">
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-primary">{encounter.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {encounter.players.length} combatant{encounter.players.length === 1 ? '' : 's'} &bull; Stage: {getStageDisplay(encounter.stage)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {encounter.lastModified ? formatDistanceToNow(new Date(encounter.lastModified), { addSuffix: true }) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                      <Button onClick={() => onSelectEncounter(encounter.id)} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                        <PlayCircle className="mr-2" /> Continue
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={`Delete ${encounter.name}`}
                          >
                            <Trash2 className="mr-1.5" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this encounter?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the "{encounter.name}" encounter.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteEncounter(encounter.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))
              ) : (
                 <p className="text-muted-foreground text-center py-4">No online encounters yet. Create one to get started!</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        {encounters.length > 0 && (
          <CardFooter className="p-4 border-t border-border">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    Delete All Encounters
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete ALL of your saved encounters.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteAllEncounters}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </CardFooter>
        )}
      </Card>
       {encounters.length === 0 && activeTab === 'local' && (
        <Card className="shadow-lg text-center mt-[-2rem]">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">No Encounters Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-lg">It's quiet here... too quiet.</p>
                <p className="text-muted-foreground mt-1">Create your first encounter to get started!</p>
            </CardContent>
        </Card>
       )}
    </div>
  );
}
