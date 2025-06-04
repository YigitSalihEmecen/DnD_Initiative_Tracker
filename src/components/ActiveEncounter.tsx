'use client';

import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import type { Player, AppStage, Encounter, Campaign, Monster } from '@/types';
import { PlayerRow } from './PlayerRow';
import BestiaryList from './BestiaryList';
import MonsterDetails from './MonsterDetails';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, ArrowLeft, ArrowRight, ListOrdered, Play, Edit3, XSquare, CheckSquare, X, BookOpen } from 'lucide-react';
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
  campaign: Campaign; 
  onCampaignUpdate: (updatedCampaign: Campaign) => void; 
  onExitEncounter: () => void;
}

type ViewMode = 'encounter' | 'bestiary' | 'monster-details';

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
  const [playerInitiative, setPlayerInitiative] = useState('');

  const [rosterEditMode, setRosterEditMode] = useState(false);
  const [playerPendingDeletion, setPlayerPendingDeletion] = useState<Player | null>(null);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Bestiary state
  const [viewMode, setViewMode] = useState<ViewMode>('encounter');
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);

  const { name: encounterName, players, stage, isFinished } = encounter;
  const isReviewMode = !!isFinished;

  const updateEncounterInCampaign = (updatedEncounterData: Partial<Encounter>) => {
    const updatedEncounter = { ...encounter, ...updatedEncounterData, lastModified: Date.now() };
    const updatedEncountersInCampaign = campaign.encounters.map(enc =>
      enc.id === updatedEncounter.id ? updatedEncounter : enc
    ).sort((a,b) => b.lastModified - a.lastModified);
    onCampaignUpdate({ ...campaign, encounters: updatedEncountersInCampaign, lastModified: Date.now() });
  };

  const showInitiativeInputFieldInAddForm = !isReviewMode && rosterEditMode && (stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE' || stage === 'INITIATIVE_SETUP');

  const handleAddPlayer = (e: FormEvent) => {
    e.preventDefault();
    if (isReviewMode) return;

    const ac = parseInt(playerAC, 10);
    const hp = parseInt(playerHP, 10);
    const initiativeVal = parseInt(playerInitiative, 10);

    if (showInitiativeInputFieldInAddForm) {
      if (!playerName.trim() || isNaN(ac) || isNaN(hp) || ac < 0 || hp <= 0 || isNaN(initiativeVal)) {
        return;
      }
    } else {
      if (!playerName.trim() || isNaN(ac) || isNaN(hp) || ac < 0 || hp <= 0) {
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
    setShowAddForm(false);
  };

  // Placeholder function for adding from bestiary
  const handleAddFromBestiary = () => {
    setViewMode('bestiary');
  };

  const handleBackToBestiary = () => {
    setSelectedMonster(null);
    setViewMode('bestiary');
  };

  const handleBackToEncounter = () => {
    setSelectedMonster(null);
    setViewMode('encounter');
  };

  const handleSelectMonster = (monster: Monster) => {
    setSelectedMonster(monster);
    setViewMode('monster-details');
  };

  const handleAddMonsterToEncounter = (monster: Player) => {
    if (isReviewMode) return;

    let updatedPlayersList = [...players, monster];
    if (stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE' || stage === 'INITIATIVE_SETUP') {
      updatedPlayersList.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    }

    updateEncounterInCampaign({ players: updatedPlayersList });
    setViewMode('encounter');
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const handleInitiativeChange = (playerId: string, initiative: number) => {
    if (isReviewMode) return;
    const updatedPlayers = players.map((p) => (p.id === playerId ? { ...p, initiative } : p));
    updateEncounterInCampaign({ players: updatedPlayers });
  };

  const confirmInitiatives = () => {
    if (isReviewMode) return;
    if (players.some(p => p.initiative === undefined || p.initiative === null || isNaN(p.initiative))) {
      return;
    }
    const sortedPlayers = [...players].sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    updateEncounterInCampaign({ players: sortedPlayers, stage: 'PRE_COMBAT' });
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
  };

  const handlePlayerAcChange = (playerId: string, newAc: number) => {
    if (isReviewMode) return;
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, ac: newAc } : p
    );
    updateEncounterInCampaign({ players: updatedPlayers });
    setLastEditedPlayerId(playerId);
  };

  const handlePlayerMaxHpChange = (playerId: string, newMaxHp: number) => {
    if (isReviewMode) return;
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, hp: newMaxHp, currentHp: Math.min(p.currentHp, newMaxHp) } : p
    );
    updateEncounterInCampaign({ players: updatedPlayers });
    setLastEditedPlayerId(playerId);
  };

  const handlePlayerCurrentHpChange = (playerId: string, newCurrentHp: number) => {
    if (isReviewMode) return;
    const playerToUpdate = players.find(p => p.id === playerId);
    if (!playerToUpdate) return;

    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, currentHp: Math.max(0, Math.min(newCurrentHp, p.hp)) } : p
    );
    updateEncounterInCampaign({ players: updatedPlayers });
    setLastEditedPlayerId(playerId);
  };

  const handleConfirmFinishEncounter = () => {
    if (isReviewMode) return;
    updateEncounterInCampaign({ isFinished: true });
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

  // Show bestiary if in bestiary mode
  if (viewMode === 'bestiary') {
    return (
      <BestiaryList 
        onSelectMonster={handleSelectMonster}
        onBack={handleBackToEncounter}
      />
    );
  }

  // Show monster details if in monster details mode
  if (viewMode === 'monster-details' && selectedMonster) {
    return (
      <MonsterDetails 
        monster={selectedMonster}
        onBack={handleBackToBestiary}
        onAddMonster={handleAddMonsterToEncounter}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex-grow font-code animate-fade-in relative">
      {/* Back button at top center */}
      <div className="flex justify-center mb-8">
        <Button 
          onClick={onExitEncounter} 
          className="h-12 w-12 rounded-xl bg-black text-white hover:bg-gray-800 border-0"
          aria-label="Back to encounters"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold">
          {encounterName} {isReviewMode && "(Finished)"}
        </h1>
        <p className="text-muted-foreground">Campaign: {campaign.name}</p>
      </header>

      {!isReviewMode && (stage === 'PLAYER_SETUP' || rosterEditMode) && showAddForm && (
        <Card className="mb-4 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <UserPlus size={28} aria-hidden="true" /> Add Combatants
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="h-8 w-8">
                <X size={16} />
              </Button>
            </div>
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

      {!isReviewMode && (stage === 'PLAYER_SETUP' || rosterEditMode) && !showAddForm && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button onClick={handleShowAddForm} className="h-14 text-xl px-12 font-regular flex-1">
            <UserPlus className="mr-2 h-6 w-6" /> Add Combatants
          </Button>
          <Button onClick={handleAddFromBestiary} className="h-14 text-xl px-12 font-regular flex-1">
            <BookOpen className="mr-2 h-6 w-6" /> Add from Bestiary
          </Button>
        </div>
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
              onAcChange={handlePlayerAcChange}
              onMaxHpChange={handlePlayerMaxHpChange}
              onCurrentHpChange={handlePlayerCurrentHpChange}
              isReviewMode={isReviewMode}
            />
          ))}
        </div>
      )}

      {!isReviewMode && stage === 'PLAYER_SETUP' && players.length > 0 && !rosterEditMode && (
        <div className="text-center mb-8 animate-fade-in">
          <Button onClick={() => { updateEncounterInCampaign({ stage: 'INITIATIVE_SETUP' }); }} size="lg">
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
            onClick={() => {updateEncounterInCampaign({stage: 'COMBAT_ACTIVE'});}} 
            size="lg" 
            className="rounded-xl w-20 h-20 shadow-2xl text-lg"
            disabled={players.length === 0}
          >
            <Play size={36}/>
          </Button>
        </div>
      )}

      <div className="mt-12 text-center flex flex-col sm:flex-row justify-center items-center gap-4">
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

