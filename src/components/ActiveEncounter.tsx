
'use client';

import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import type { Player, AppStage, Encounter, Campaign } from '@/types';
import { PlayerRow } from './PlayerRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowLeft, ArrowRight, ListOrdered, Play, Edit3, XSquare, CheckSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActiveEncounterProps {
  encounter: Encounter;
  campaign: Campaign; // The parent campaign
  onCampaignUpdate: (updatedCampaign: Campaign) => void; // To update the entire campaign
  onExitEncounter: () => void;
}

export default function ActiveEncounter({ 
  encounter, 
  campaign, 
  onCampaignUpdate, 
  onExitEncounter 
}: ActiveEncounterProps) {
  const [lastEditedPlayerId, setLastEditedPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerAC, setPlayerAC] = useState('');
  const [playerHP, setPlayerHP] = useState('');
  const [playerInitiative, setPlayerInitiative] = useState(''); // For adding new player in edit mode during combat
  const { toast } = useToast();

  const [rosterEditMode, setRosterEditMode] = useState(false);
  const [playerPendingDeletion, setPlayerPendingDeletion] = useState<Player | null>(null);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);


  const { name: encounterName, players, stage, isFinished } = encounter;
  const isReviewMode = !!isFinished;


  const updateEncounterInCampaign = (updatedEncounterData: Partial<Encounter>) => {
    const updatedEncounter = { ...encounter, ...updatedEncounterData, lastModified: Date.now() };
    const updatedEncountersInCampaign = campaign.encounters.map(enc =>
      enc.id === updatedEncounter.id ? updatedEncounter : enc
    ).sort((a,b) => b.lastModified - a.lastModified);
    onCampaignUpdate({ ...campaign, encounters: updatedEncountersInCampaign, lastModified: Date.now() });
  };

  // Determine if initiative input is needed in add form based on current mode and stage (but not in review mode)
  const showInitiativeInputFieldInAddForm = !isReviewMode && rosterEditMode && (stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE' || stage === 'INITIATIVE_SETUP');


  const handleAddPlayer = (e: FormEvent) => {
    e.preventDefault();
    if (isReviewMode) return; // No adding players in review mode

    const ac = parseInt(playerAC, 10);
    const hp = parseInt(playerHP, 10);
    const initiativeVal = parseInt(playerInitiative, 10);

    if (showInitiativeInputFieldInAddForm) {
      if (!playerName.trim() || isNaN(ac) || isNaN(hp) || ac < 0 || hp <= 0 || isNaN(initiativeVal)) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid Name, AC (non-negative), HP (positive), and Initiative.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!playerName.trim() || isNaN(ac) || isNaN(hp) || ac < 0 || hp <= 0) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid Name, AC (non-negative), and HP (positive).",
          variant: "destructive",
        });
        return;
      }
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: playerName.trim(),
      ac,
      hp,
      initiative: showInitiativeInputFieldInAddForm ? initiativeVal : 0,
      currentHp: hp,
    };

    let updatedPlayersList = [...players, newPlayer];
    if (stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE' || stage === 'INITIATIVE_SETUP') {
      updatedPlayersList.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    }
    
    updateEncounterInCampaign({ players: updatedPlayersList });
    
    setPlayerName('');
    setPlayerAC('');
    setPlayerHP('');
    if (showInitiativeInputFieldInAddForm) {
      setPlayerInitiative('');
    }
    toast({
      title: "Combatant Added",
      description: `${newPlayer.name} has been added to "${encounterName}".`,
    });
  };

  const handleInitiativeChange = (playerId: string, initiative: number) => {
    if (isReviewMode) return;
    const updatedPlayers = players.map((p) => (p.id === playerId ? { ...p, initiative } : p));
    updateEncounterInCampaign({ players: updatedPlayers });
  };

  const confirmInitiatives = () => {
    if (isReviewMode) return;
    if (players.some(p => p.initiative === undefined || p.initiative === null || isNaN(p.initiative))) {
       toast({
        title: "Missing Initiatives",
        description: "Please set initiative for all combatants.",
        variant: "destructive",
      });
      return;
    }
    const sortedPlayers = [...players].sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    updateEncounterInCampaign({ players: sortedPlayers, stage: 'PRE_COMBAT' });
     toast({
      title: "Initiatives Set",
      description: `Combatants ordered for "${encounterName}". Ready to start!`,
    });
  };

  const handleDamageApply = (playerId: string, damage: number) => {
    if (isReviewMode) return;
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, currentHp: Math.max(0, p.currentHp - damage) } : p
    );
    updateEncounterInCampaign({ players: updatedPlayers });
    setLastEditedPlayerId(playerId);
  };
  
  const handleHealApply = (playerId: string, heal: number) => {
    if (isReviewMode) return;
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, currentHp: Math.min(p.currentHp + heal, p.hp) } : p
    );
    updateEncounterInCampaign({ players: updatedPlayers });
    setLastEditedPlayerId(playerId);
  };

  const handleToggleRosterEditMode = () => {
    if (isReviewMode) return;
    setRosterEditMode(prev => !prev);
  };

  const handleInitiateDeletePlayer = (player: Player) => {
    if (isReviewMode) return;
    setPlayerPendingDeletion(player);
  };

  const handleConfirmDeletePlayer = () => {
    if (isReviewMode || !playerPendingDeletion) return;

    const playerId = playerPendingDeletion.id;
    const playerName = playerPendingDeletion.name;
    const updatedPlayers = players.filter(p => p.id !== playerId);
    
    let updatedStage = encounter.stage;
    if (updatedPlayers.length === 0 && (stage === 'INITIATIVE_SETUP' || stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE')) {
      updatedStage = 'PLAYER_SETUP';
    }

    updateEncounterInCampaign({ players: updatedPlayers, stage: updatedStage });
    
    toast({
      title: "Combatant Removed",
      description: `"${playerName}" has been removed from "${encounterName}".`,
    });
    setPlayerPendingDeletion(null);
    if (updatedPlayers.length === 0) {
      setRosterEditMode(false); 
    }
  };

  const handleCancelDeletePlayer = () => {
    setPlayerPendingDeletion(null);
  };
  
  const handlePlayerNameChange = (playerId: string, newName: string) => {
    if (isReviewMode) return;
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, name: newName } : p
    );
    updateEncounterInCampaign({ players: updatedPlayers });
    setLastEditedPlayerId(playerId); 
    toast({
      title: "Combatant Name Updated",
      description: `Name changed to "${newName}".`,
    });
  };

  const handleConfirmFinishEncounter = () => {
    if (isReviewMode) return;
    updateEncounterInCampaign({ isFinished: true });
    toast({
      title: "Encounter Finished",
      description: `"${encounterName}" has been marked as complete.`,
    });
    setIsFinishConfirmOpen(false);
    onExitEncounter();
  };

  useEffect(() => {
    if (lastEditedPlayerId) {
      const timer = setTimeout(() => {
        setLastEditedPlayerId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastEditedPlayerId]);

  const showDeleteButtonOnRow = !isReviewMode && rosterEditMode;
  const formGridColsClass = showInitiativeInputFieldInAddForm ? "md:grid-cols-5" : "md:grid-cols-4";


  return (
    <div className="container mx-auto p-4 md:p-8 flex-grow font-code animate-fade-in">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold">
          {encounterName} {isReviewMode && "(Finished)"}
        </h1>
        <p className="text-muted-foreground">Campaign: {campaign.name} &bull; D&amp;D Initiative and Combat Tracker</p>
      </header>

      {!isReviewMode && (stage === 'PLAYER_SETUP' || rosterEditMode) && (
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-headline">
              <UserPlus size={28} aria-hidden="true" /> Add Combatants
            </CardTitle>
            <CardDescription>Enter player or monster details to add them to "{encounterName}". {rosterEditMode && (stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE' || stage === 'INITIATIVE_SETUP') ? "Provide initiative for correct placement." : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPlayer} className={`grid grid-cols-1 sm:grid-cols-2 ${formGridColsClass} gap-4 items-end`}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerName" className="text-sm font-medium">Name</label>
                <Input id="playerName" value={playerName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)} placeholder="..." required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerAC" className="text-sm font-medium">Armor Class (AC)</label>
                <Input id="playerAC" type="number" value={playerAC} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerAC(e.target.value)} placeholder="..." required min="0"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerHP" className="text-sm font-medium">Hit Points (HP)</label>
                <Input id="playerHP" type="number" value={playerHP} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerHP(e.target.value)} placeholder="..." required min="1"/>
              </div>
              {showInitiativeInputFieldInAddForm && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="playerInitiative" className="text-sm font-medium">Initiative</label>
                  <Input id="playerInitiative" type="number" value={playerInitiative} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerInitiative(e.target.value)} placeholder="..." required />
                </div>
              )}
              <Button type="submit" className="w-full sm:w-auto md:self-end h-10">
                <UserPlus className="mr-2 h-4 w-4" /> Add
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {players.length > 0 && (
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-headline font-semibold mb-3">
            {isReviewMode ? 'Final Combatant Roster:' :
             stage === 'COMBAT_ACTIVE' && !rosterEditMode ? 'Combat Active:' : 
             stage === 'PRE_COMBAT' && !rosterEditMode ? 'Initiative Order:' : 
             'Current Combatants:'}
             {!isReviewMode && rosterEditMode && ' (Editing Roster)'}
          </h2>
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stage={stage}
              isHighlighted={p.id === lastEditedPlayerId} 
              onInitiativeChange={handleInitiativeChange}
              onDamageApply={handleDamageApply} 
              onHealApply={handleHealApply}
              showDeleteButton={showDeleteButtonOnRow}
              onInitiateDelete={handleInitiateDeletePlayer}
              disableCombatActions={rosterEditMode || isReviewMode} 
              isRosterEditing={!isReviewMode && rosterEditMode}
              onNameChange={handlePlayerNameChange}
              isReviewMode={isReviewMode}
            />
          ))}
        </div>
      )}
      
      {!isReviewMode && stage === 'PLAYER_SETUP' && players.length > 0 && !rosterEditMode && (
        <div className="text-center mb-8 animate-fade-in">
          <Button onClick={() => { updateEncounterInCampaign({ stage: 'INITIATIVE_SETUP' }); toast({title: "Set Initiatives", description: `Enter initiative scores for each combatant in "${encounterName}".`}); }} size="lg">
            Proceed to Initiative <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {!isReviewMode && stage === 'INITIATIVE_SETUP' && !rosterEditMode && (
        <div className="text-center mb-8 animate-fade-in">
          <Button onClick={confirmInitiatives} size="lg" disabled={players.length === 0}>
            <ListOrdered className="mr-2 h-5 w-5" /> Confirm Initiatives & Order
          </Button>
        </div>
      )}
      
      {!isReviewMode && stage === 'PRE_COMBAT' && !rosterEditMode && (
         <div className="text-center my-8 animate-fade-in">
          <Button 
            onClick={() => {updateEncounterInCampaign({stage: 'COMBAT_ACTIVE'}); toast({title: `Encounter Started: ${encounterName}!`, description: "May your dice roll true."});}} 
            size="lg" 
            className="rounded-xl w-20 h-20 shadow-2xl text-lg"
            disabled={players.length === 0}
          >
            <Play size={36}/>
          </Button>
        </div>
      )}

      <div className="mt-12 text-center flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button onClick={onExitEncounter} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Encounters List
          </Button>
          {!isReviewMode && (
            <Button onClick={handleToggleRosterEditMode} variant="outline">
              {rosterEditMode ? <XSquare className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
              {rosterEditMode ? 'Done Editing' : 'Edit Roster'}
            </Button>
          )}
          {!isReviewMode && stage === 'COMBAT_ACTIVE' && !rosterEditMode && (
            <Button onClick={() => setIsFinishConfirmOpen(true)} variant="default">
              <CheckSquare className="mr-2 h-4 w-4" /> Finish Encounter
            </Button>
          )}
      </div>

      {!isReviewMode && players.length === 0 && stage !== 'PLAYER_SETUP' && !rosterEditMode && (
        <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">No combatants added to "{encounterName}" yet.</p>
            <Button onClick={() => {
                updateEncounterInCampaign({stage: 'PLAYER_SETUP'});
                if (!rosterEditMode) setRosterEditMode(true); 
            }}>
                Add Combatants
            </Button>
        </div>
      )}

      {playerPendingDeletion && !isReviewMode && (
        <AlertDialog open={!!playerPendingDeletion} onOpenChange={(isOpen) => { if (!isOpen) handleCancelDeletePlayer(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently remove "{playerPendingDeletion.name}" from the encounter. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDeletePlayer}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeletePlayer} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete Combatant
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isFinishConfirmOpen && !isReviewMode && (
        <AlertDialog open={isFinishConfirmOpen} onOpenChange={setIsFinishConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finish Encounter?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark "{encounterName}" as finished? Combatants and their statuses will be saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsFinishConfirmOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmFinishEncounter}>
                Finish Encounter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}

