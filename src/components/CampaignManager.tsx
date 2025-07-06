'use client';

import type { Campaign, Encounter } from '@/types';
import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderPlus, PlayCircle, Trash2, Edit3, ListChecks, FolderKanban, Pencil, XSquare, FilePlus, LogIn, LogOut, User, Cloud, CloudOff, Wifi, WifiOff } from 'lucide-react';
import { signInWithGoogle, signOutUser } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
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
  user: import('@/types').User | null;
}

export default function CampaignManagerComponent({
  campaigns,
  onCreateCampaign,
  onSelectCampaign,
  onDeleteCampaign,
  onDeleteAllCampaigns,
  onUpdateCampaign,
  user,
}: CampaignManagerProps) {
  const { syncStatus } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Campaign editing states
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCreateCampaign = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = newCampaignName.trim();
    if (trimmedName) {
      onCreateCampaign(trimmedName);
      setNewCampaignName('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setNewCampaignName('');
    setIsCreateDialogOpen(true);
  };

  const handleStartEditing = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setEditName(campaign.name);
  };

  const handleSaveEdit = () => {
    if (editingCampaignId && editName.trim()) {
      const campaignToUpdate = campaigns.find(c => c.id === editingCampaignId);
      if (campaignToUpdate) {
        onUpdateCampaign({
          ...campaignToUpdate,
          name: editName.trim(),
          lastModified: Date.now()
        });
      }
    }
    setEditingCampaignId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingCampaignId(null);
    setEditName('');
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Login failed: ${errorMessage}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout failed:', error);
    }
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

      {/* User Status & Sync Information */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-primary">
                    <User size={20} />
                    <span className="font-medium">{user.displayName || user.email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {syncStatus.isOnline ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Cloud size={14} />
                        <span>Cloud Sync Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-600">
                        <CloudOff size={14} />
                        <span>Offline Mode</span>
                      </div>
                    )}
                    {syncStatus.isSyncing && (
                      <span className="ml-2 text-blue-600">Syncing...</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User size={20} />
                  <span>Guest User (Local Storage Only)</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {user ? (
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="mr-2" size={16} />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  onClick={handleGoogleLogin} 
                  disabled={isLoggingIn || !isFirebaseConfigured()}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  size="sm"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Signing In...
                    </div>
                  ) : !isFirebaseConfigured() ? (
                    <>
                      <LogIn className="mr-2" size={16} />
                      Setup Required
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2" size={16} />
                      Sign In with Google
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {!user && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {!isFirebaseConfigured() ? (
                  <>
                    <strong>🔧 Firebase Setup Required:</strong> Configure Firebase to enable Google sign-in and cloud sync. See FIREBASE_SETUP.md for instructions.
                  </>
                ) : (
                  <>
                    <strong>💡 Sign in to enable cloud sync!</strong> Your campaigns will be saved across all your devices and backed up automatically.
                  </>
                )}
              </p>
            </div>
          )}

          {syncStatus.syncError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>⚠️ Sync Error:</strong> {syncStatus.syncError}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Button onClick={handleOpenCreateDialog} size="lg" className="h-12 text-lg px-8 w-full">
        <FilePlus className="mr-2" /> Create New Campaign
      </Button>

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
            <AlertDialogAction onClick={handleCreateCampaign}>Create & Open Campaign</AlertDialogAction>
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
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              aria-label="Edit Campaign Name"
              className="text-base p-3 h-12"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelEdit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Save Name</AlertDialogAction>
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
                    {editingCampaignId === campaign.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleStartEditing(campaign)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Pencil size={16} />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.encounters.length} encounter{campaign.encounters.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    Last updated: {campaign.lastModified ? formatDistanceToNow(new Date(campaign.lastModified), { addSuffix: true }) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                  {!editingCampaignId && (
                    <Button onClick={() => onSelectCampaign(campaign.id)} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                      <PlayCircle className="mr-2" /> Manage Encounters
                    </Button>
                  )}
                  {editingCampaignId === campaign.id && (
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
        {campaigns.length > 0 && editingCampaignId && (
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
    </div>
  );
}
