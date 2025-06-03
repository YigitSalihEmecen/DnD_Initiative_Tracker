'use client';

import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import type { Player, AppStage, Encounter } from '@/types';
import { PlayerRow } from './PlayerRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowLeft, ArrowRight, ListOrdered, Play, ShieldAlert, Trash2 } from 'lucide-react';

interface ActiveEncounterProps {
  encounter: Encounter;
  onEncounterUpdate: (updatedEncounter: Encounter) => void;
  onExitEncounter: () => void;
}

export default function ActiveEncounter({ encounter, onEncounterUpdate, onExitEncounter }: ActiveEncounterProps) {
  const [lastEditedPlayerId, setLastEditedPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerAC, setPlayerAC] = useState('');
  const [playerHP, setPlayerHP] = useState('');
  const { toast } = useToast();

  const { name: encounterName, players, stage } = encounter;

  const handleAddPlayer = (e: FormEvent) => {
    e.preventDefault();
    const ac = parseInt(playerAC, 10);
    const hp = parseInt(playerHP, 10);

    if (!playerName.trim() || isNaN(ac) || isNaN(hp) || ac < 0 || hp <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid Name, AC (non-negative), and HP (positive).",
        variant: "destructive",
      });
      return;
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: playerName.trim(),
      ac,
      hp,
      initiative: 0,
      currentHp: hp,
    };
    const updatedPlayers = [...players, newPlayer];
    onEncounterUpdate({ ...encounter, players: updatedPlayers });
    setPlayerName('');
    setPlayerAC('');
    setPlayerHP('');
    toast({
      title: "Combatant Added",
      description: `${newPlayer.name} has been added to "${encounterName}".`,
    });
  };

  const handleInitiativeChange = (playerId: string, initiative: number) => {
    const updatedPlayers = players.map((p) => (p.id === playerId ? { ...p, initiative } : p));
    onEncounterUpdate({ ...encounter, players: updatedPlayers });
  };

  const confirmInitiatives = () => {
    if (players.some(p => p.initiative === undefined || p.initiative === null || isNaN(p.initiative))) {
       toast({
        title: "Missing Initiatives",
        description: "Please set initiative for all combatants.",
        variant: "destructive",
      });
      return;
    }
    const sortedPlayers = [...players].sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    onEncounterUpdate({ ...encounter, players: sortedPlayers, stage: 'PRE_COMBAT' });
     toast({
      title: "Initiatives Set",
      description: `Combatants ordered for "${encounterName}". Ready to start!`,
    });
  };

  const handleDamageApply = (playerId: string, damage: number) => {
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, currentHp: p.currentHp - damage } : p
    );
    onEncounterUpdate({ ...encounter, players: updatedPlayers });
    setLastEditedPlayerId(playerId);
  };
  
  const handleHealApply = (playerId: string, heal: number) => {
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, currentHp: Math.min(p.currentHp + heal, p.hp) } : p
    );
    onEncounterUpdate({ ...encounter, players: updatedPlayers });
    setLastEditedPlayerId(playerId);
  };

  const clearCurrentEncounterCombatants = () => {
    if (confirm(`Are you sure you want to clear all combatants from "${encounterName}"? This action will reset its setup stage.`)) {
        onEncounterUpdate({ ...encounter, players: [], stage: 'PLAYER_SETUP' });
        setLastEditedPlayerId(null);
        toast({
        title: "Combatants Cleared",
        description: `All combatants removed from "${encounterName}". Ready to re-add.`,
        });
    }
  };
  
  useEffect(() => {
    if (lastEditedPlayerId) {
      const timer = setTimeout(() => {
        setLastEditedPlayerId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastEditedPlayerId]);

  return (
    <div className="container mx-auto p-4 md:p-8 flex-grow font-code animate-fade-in">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold">
          {encounterName}
        </h1>
        <p className="text-muted-foreground">D&amp;D Initiative and Combat Tracker</p>
      </header>

      {stage === 'PLAYER_SETUP' && (
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-headline">
              <UserPlus size={28} aria-hidden="true" /> Add Combatants
            </CardTitle>
            <CardDescription>Enter player or monster details to add them to "{encounterName}".</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerName" className="text-sm font-medium">Name</label>
                <Input id="playerName" value={playerName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)} placeholder="e.g., Orc Raider" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerAC" className="text-sm font-medium">Armor Class (AC)</label>
                <Input id="playerAC" type="number" value={playerAC} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerAC(e.target.value)} placeholder="e.g., 13" required min="0"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerHP" className="text-sm font-medium">Hit Points (HP)</label>
                <Input id="playerHP" type="number" value={playerHP} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerHP(e.target.value)} placeholder="e.g., 15" required min="1"/>
              </div>
              <Button type="submit" className="w-full sm:w-auto md:self-end h-10">
                <UserPlus className="mr-2 h-4 w-4" /> Add to Encounter
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {players.length > 0 && (stage === 'PLAYER_SETUP' || stage === 'INITIATIVE_SETUP') && (
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-headline font-semibold mb-3">Current Combatants:</h2>
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stage={stage}
              isHighlighted={false} 
              onInitiativeChange={handleInitiativeChange}
              onDamageApply={handleDamageApply} 
              onHealApply={handleHealApply} 
            />
          ))}
        </div>
      )}
      
      {stage === 'PLAYER_SETUP' && players.length > 0 && (
        <div className="text-center mb-8 animate-fade-in">
          <Button onClick={() => { onEncounterUpdate({...encounter, stage: 'INITIATIVE_SETUP'}); toast({title: "Set Initiatives", description: `Enter initiative scores for each combatant in "${encounterName}".`}); }} size="lg">
            Proceed to Initiative <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {stage === 'INITIATIVE_SETUP' && (
        <div className="text-center mb-8 animate-fade-in">
          <Button onClick={confirmInitiatives} size="lg" disabled={players.length === 0}>
            <ListOrdered className="mr-2 h-5 w-5" /> Confirm Initiatives & Order
          </Button>
        </div>
      )}

      {(stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE') && (
         <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-headline font-semibold mb-3">
            {stage === 'COMBAT_ACTIVE' ? `Combat Active!` : `Initiative Order:`}
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
            />
          ))}
        </div>
      )}
      
      {stage === 'PRE_COMBAT' && (
        <div className="fixed bottom-6 right-6 animate-fade-in">
          <Button 
            onClick={() => {onEncounterUpdate({...encounter, stage: 'COMBAT_ACTIVE'}); toast({title: `Encounter Started: ${encounterName}!`, description: "May your dice roll true."});}} 
            size="lg" 
            className="rounded-full w-20 h-20 shadow-2xl text-lg"
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
          {(stage !== 'PLAYER_SETUP' || players.length > 0) && (
            <Button onClick={clearCurrentEncounterCombatants} variant="destructive" className="bg-destructive/90 hover:bg-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Clear Combatants
            </Button>
          )}
      </div>

      {players.length === 0 && stage !== 'PLAYER_SETUP' && (
        <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">No combatants added to "{encounterName}" yet.</p>
            <Button onClick={() => onEncounterUpdate({...encounter, stage: 'PLAYER_SETUP'})}>
                Add Combatants
            </Button>
        </div>
      )}
    </div>
  );
}
