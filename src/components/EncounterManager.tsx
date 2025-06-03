
'use client';

import type { Encounter, Campaign } from '@/types';
import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, PlayCircle, Trash2, Edit3, ListChecks, ArrowLeft, Pencil, XSquare } from 'lucide-react';
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
import { Label } from "@/components/ui/label";

interface EncounterManagerProps {
  campaign: Campaign;
  onCampaignUpdate: (updatedCampaign: Campaign) => void;
  onSelectEncounter: (id: string) => void;
  onExitCampaign: () => void;
}

export default function EncounterManager({
  campaign,
  onCampaignUpdate,
  onSelectEncounter,
  onExitCampaign,
}: EncounterManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEncounterName, setNewEncounterName] = useState('');
  
  const [editingEncounterId, setEditingEncounterId] = useState<string | null>(null);
  const [dialogEncounterNameForEdit, setDialogEncounterNameForEdit] = useState('');

  const [isEncounterEditMode, setIsEncounterEditMode] = useState(false);
  
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenCreateDialog = () => {
    setNewEncounterName('');
    setIsCreateDialogOpen(true);
  };

  const handleConfirmCreateEncounter = () => {
    if (!newEncounterName.trim()) {
      toast({
        title: "Encounter Name Required",
        description: "Please enter a name for the new encounter.",
        variant: "destructive",
      });
      return;
    }
    const newEncounter: Encounter = {
      id: crypto.randomUUID(),
      name: newEncounterName.trim() || `Encounter ${campaign.encounters.length + 1}`,
      players: [],
      stage: 'PLAYER_SETUP',
      createdDate: Date.now(),
      lastModified: Date.now(),
    };
    const updatedEncounters = [newEncounter, ...campaign.encounters].sort((a,b) => b.lastModified - a.lastModified);
    onCampaignUpdate({ ...campaign, encounters: updatedEncounters, lastModified: Date.now() });
    
    onSelectEncounter(newEncounter.id); 
    toast({
      title: "Encounter Created",
      description: `"${newEncounterName}" in campaign "${campaign.name}" is ready. Continuing...`,
    });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteEncounter = (encounterId: string) => {
    const encounterToDelete = campaign.encounters.find(enc => enc.id === encounterId);
    if (!encounterToDelete) {
        toast({ title: "Error", description: "Encounter not found for deletion.", variant: "destructive" });
        return;
    }
    const updatedEncounters = campaign.encounters.filter(enc => enc.id !== encounterId);
    onCampaignUpdate({ ...campaign, encounters: updatedEncounters, lastModified: Date.now() });
    toast({ title: "Encounter Deleted", description: `"${encounterToDelete.name}" removed from campaign "${campaign.name}".` });
  };

  const handleDeleteAllEncountersInCampaign = () => {
    onCampaignUpdate({ ...campaign, encounters: [], lastModified: Date.now() });
    toast({ title: "All Encounters Deleted", description: `All encounters in campaign "${campaign.name}" removed.` });
  };
  
  const getStageDisplay = (stage?: string) => {
    if (!stage) return 'Unknown Stage';
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  const handleOpenEditEncounterDialog = (encounter: Encounter) => {
    setEditingEncounterId(encounter.id);
    setDialogEncounterNameForEdit(encounter.name);
  };

  const handleConfirmEditEncounterName = () => {
    if (!editingEncounterId || !dialogEncounterNameForEdit.trim()) {
      toast({
        title: "Invalid Input",
        description: "Encounter name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    const encounterToUpdate = campaign.encounters.find(enc => enc.id === editingEncounterId);
    if (encounterToUpdate) {
      const updatedEncounter = { 
        ...encounterToUpdate, 
        name: dialogEncounterNameForEdit.trim(),
        lastModified: Date.now() 
      };
      const updatedEncounters = campaign.encounters.map(enc => 
        enc.id === editingEncounterId ? updatedEncounter : enc
      ).sort((a,b) => b.lastModified - a.lastModified);
      
      onCampaignUpdate({ ...campaign, encounters: updatedEncounters, lastModified: Date.now() });
      toast({
        title: "Encounter Updated",
        description: `Encounter name changed to "${updatedEncounter.name}".`,
      });
    }
    setEditingEncounterId(null);
    setDialogEncounterNameForEdit('');
  };

  const handleToggleEncounterEditMode = () => {
    setIsEncounterEditMode(prev => !prev);
  };


  if (!isClient) {
     return (
      <div className="container mx-auto p-4 md:p-8 font-code flex justify-center items-center min-h-[calc(100vh-10rem)]">
        {/* Minimal loading state */}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in font-code">
      <header className="mb-10 text-center pt-8 md:pt-0">
        <h1 className="text-4xl font-headline font-bold tracking-tight">Campaign: {campaign.name}</h1>
        <p className="text-xl text-muted-foreground mt-2">Manage Encounters for this Campaign</p>
      </header>
      
      <Card className="shadow-xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline text-primary">
            <FilePlus size={32} /> Create New Encounter
          </CardTitle>
          <CardDescription className="text-base">Launch a new adventure within "{campaign.name}". Click below to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenCreateDialog} size="lg" className="h-12 text-lg px-8 w-full">
            <Edit3 className="mr-2" /> Create New Encounter
          </Button>
        </CardContent>
      </Card>

      {/* Create Encounter Dialog */}
      <AlertDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Encounter Details for "{campaign.name}"</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a name for your new encounter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="e.g., The Goblin Ambush"
              value={newEncounterName}
              onChange={(e) => setNewEncounterName(e.target.value)}
              aria-label="New Encounter Name"
              className="text-base p-3 h-12"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateEncounter}>Create Encounter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Encounter Name Dialog */}
      <AlertDialog open={!!editingEncounterId} onOpenChange={(isOpen) => { if (!isOpen) setEditingEncounterId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Encounter Name</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the new name for this encounter in "{campaign.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="New encounter name"
              value={dialogEncounterNameForEdit}
              onChange={(e) => setDialogEncounterNameForEdit(e.target.value)}
              aria-label="Edit Encounter Name"
              className="text-base p-3 h-12"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditingEncounterId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEditEncounterName}>Save Name</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
              <ListChecks size={32} /> Encounters in "{campaign.name}"
          </CardTitle>
          <CardDescription className="text-base">Jump back into the action or manage your saved scenarios for this campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.encounters.length > 0 ? (
            campaign.encounters.map((encounter) => (
              <Card key={encounter.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:shadow-md transition-shadow duration-200 mb-3">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-primary">{encounter.name}</h3>
                    {isEncounterEditMode && (
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditEncounterDialog(encounter)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Pencil size={16} />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {encounter.players.length} combatant{encounter.players.length === 1 ? '' : 's'} &bull; Stage: {getStageDisplay(encounter.stage)}
                  </p>
                   {encounter.createdDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(encounter.createdDate).toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {encounter.lastModified ? formatDistanceToNow(new Date(encounter.lastModified), { addSuffix: true }) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                  {!isEncounterEditMode && (
                    <Button onClick={() => onSelectEncounter(encounter.id)} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                      <PlayCircle className="mr-2" /> Continue
                    </Button>
                  )}
                  {isEncounterEditMode && (
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
                            This action cannot be undone. This will permanently delete the "{encounter.name}" encounter from "{campaign.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEncounter(encounter.id)}>Delete Encounter</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            ))
          ) : (
             <p className="text-muted-foreground text-center py-4">No encounters yet in "{campaign.name}". Create one to get started!</p>
          )}
        </CardContent>
        {campaign.encounters.length > 0 && isEncounterEditMode && (
          <CardFooter className="p-4 border-t border-border">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    Delete All Encounters in this Campaign
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete ALL encounters within the campaign "{campaign.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllEncountersInCampaign}>Delete All Encounters</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </CardFooter>
        )}
      </Card>
       {campaign.encounters.length === 0 && !isEncounterEditMode && (
        <Card className="shadow-lg text-center mt-4">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">No Encounters Yet in "{campaign.name}"</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-lg">This campaign is quiet... too quiet.</p>
                <p className="text-muted-foreground mt-1">Create your first encounter for this campaign to get started!</p>
            </CardContent>
        </Card>
       )}
      <div className="mt-12 text-center flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button onClick={onExitCampaign} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
        </Button>
        <Button onClick={handleToggleEncounterEditMode} variant="outline">
          {isEncounterEditMode ? <XSquare className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
          {isEncounterEditMode ? 'Done Editing' : 'Edit Encounters'}
        </Button>
      </div>
    </div>
  );
}
