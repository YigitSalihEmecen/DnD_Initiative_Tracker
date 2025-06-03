
'use client';

import type { Campaign } from '@/types';
import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderPlus, PlayCircle, Trash2, Edit3, ListChecks, FolderKanban, Pencil, XSquare } from 'lucide-react';
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

interface CampaignManagerProps {
  campaigns: Campaign[];
  onCreateCampaign: (name: string) => string; // Returns new campaign ID
  onSelectCampaign: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  onDeleteAllCampaigns: () => void;
  onUpdateCampaign: (updatedCampaign: Campaign) => void; // For name edits
}

export default function CampaignManagerComponent({
  campaigns,
  onCreateCampaign,
  onSelectCampaign,
  onDeleteCampaign,
  onDeleteAllCampaigns,
  onUpdateCampaign,
}: CampaignManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [dialogCampaignNameForEdit, setDialogCampaignNameForEdit] = useState('');
  const [isCampaignEditMode, setIsCampaignEditMode] = useState(false);

  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenCreateDialog = () => {
    setNewCampaignName('');
    setIsCreateDialogOpen(true);
  };

  const handleConfirmCreateCampaign = () => {
    if (!newCampaignName.trim()) {
      toast({
        title: "Campaign Name Required",
        description: "Please enter a name for the new campaign.",
        variant: "destructive",
      });
      return;
    }
    const newId = onCreateCampaign(newCampaignName);
    toast({
      title: "Campaign Created",
      description: `"${newCampaignName}" is ready. Select it to add encounters.`,
    });
    setIsCreateDialogOpen(false);
    onSelectCampaign(newId); // Navigate to the new campaign
  };

  const handleOpenEditDialog = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setDialogCampaignNameForEdit(campaign.name);
  };

  const handleConfirmEditCampaignName = () => {
    if (!editingCampaignId || !dialogCampaignNameForEdit.trim()) {
      toast({
        title: "Invalid Input",
        description: "Campaign name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    const campaignToUpdate = campaigns.find(c => c.id === editingCampaignId);
    if (campaignToUpdate) {
      const updatedCampaign = { 
        ...campaignToUpdate, 
        name: dialogCampaignNameForEdit.trim(),
        lastModified: Date.now()
      };
      onUpdateCampaign(updatedCampaign);
      toast({
        title: "Campaign Updated",
        description: `Campaign name changed to "${updatedCampaign.name}".`,
      });
    }
    setEditingCampaignId(null);
    setDialogCampaignNameForEdit('');
  };

  const handleToggleCampaignEditMode = () => {
    setIsCampaignEditMode(prev => !prev);
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
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-headline font-bold tracking-tight">EncounterFlow</h1>
        <p className="text-xl text-muted-foreground mt-2">Your D&amp;D Campaign & Encounter Command Center</p>
      </header>
      
      <Card className="shadow-xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline text-primary">
            <FolderPlus size={32} /> Create New Campaign
          </CardTitle>
          <CardDescription className="text-base">Start a new saga. Click below to define your campaign.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenCreateDialog} size="lg" className="h-12 text-lg px-8 w-full">
            <Edit3 className="mr-2" /> Create New Campaign
          </Button>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <AlertDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Campaign Details</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a name for your new campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="e.g., The Dragon's Hoard"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              aria-label="New Campaign Name"
              className="text-base p-3 h-12"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateCampaign}>Create & Open Campaign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Campaign Name Dialog */}
      <AlertDialog open={!!editingCampaignId} onOpenChange={(isOpen) => { if (!isOpen) setEditingCampaignId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Campaign Name</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the new name for this campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="New campaign name"
              value={dialogCampaignNameForEdit}
              onChange={(e) => setDialogCampaignNameForEdit(e.target.value)}
              aria-label="Edit Campaign Name"
              className="text-base p-3 h-12"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditingCampaignId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEditCampaignName}>Save Name</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-headline">
              <FolderKanban size={32} /> Your Campaigns
          </CardTitle>
          <CardDescription className="text-base">Select a campaign to manage its encounters or create a new one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <Card key={campaign.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 hover:shadow-md transition-shadow duration-200 mb-3">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-primary">{campaign.name}</h3>
                    {isCampaignEditMode && (
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(campaign)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Pencil size={16} />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.encounters.length} encounter{campaign.encounters.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {campaign.lastModified ? formatDistanceToNow(new Date(campaign.lastModified), { addSuffix: true }) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                  <Button onClick={() => onSelectCampaign(campaign.id)} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                    <PlayCircle className="mr-2" /> Manage Encounters
                  </Button>
                  {isCampaignEditMode && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          aria-label={`Delete ${campaign.name}`}
                        >
                          <Trash2 className="mr-1.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this campaign?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the "{campaign.name}" campaign and all its encounters.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteCampaign(campaign.id)}>Delete Campaign</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            ))
          ) : (
             <p className="text-muted-foreground text-center py-4 text-lg">Start by creating a campaign!</p>
          )}
        </CardContent>
        {campaigns.length > 0 && isCampaignEditMode && (
          <CardFooter className="p-4 border-t border-border">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    Delete All Campaigns
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete ALL of your saved campaigns and their encounters.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteAllCampaigns}>Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </CardFooter>
        )}
      </Card>
       {campaigns.length === 0 && (
         <Card className="shadow-lg text-center mt-4">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">No Campaigns Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-lg">The chronicles are empty.</p>
                <p className="text-muted-foreground mt-1">Create your first campaign to begin your adventures!</p>
            </CardContent>
        </Card>
       )}
      <div className="mt-12 text-center flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button onClick={handleToggleCampaignEditMode} variant="outline">
          {isCampaignEditMode ? <XSquare className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
          {isCampaignEditMode ? 'Done Editing' : 'Edit Campaigns'}
        </Button>
      </div>
    </div>
  );
}
