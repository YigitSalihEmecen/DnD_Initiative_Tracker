'use client';

import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import type { Player, AppStage } from '@/types';
import { PlayerRow } from './PlayerRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowRight, ListOrdered, Play, ShieldAlert } from 'lucide-react';

export default function EncounterTrackerPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stage, setStage] = useState<AppStage>('PLAYER_SETUP');
  const [lastEditedPlayerId, setLastEditedPlayerId] = useState<string | null>(null);

  const [playerName, setPlayerName] = useState('');
  const [playerAC, setPlayerAC] = useState('');
  const [playerHP, setPlayerHP] = useState('');

  const { toast } = useToast();

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
      initiative: 0, // Default initiative, will be set in next stage
      currentHp: hp,
    };
    setPlayers([...players, newPlayer]);
    setPlayerName('');
    setPlayerAC('');
    setPlayerHP('');
    toast({
      title: "Player Added",
      description: `${newPlayer.name} has been added to the encounter.`,
    });
  };

  const handleInitiativeChange = (playerId: string, initiative: number) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => (p.id === playerId ? { ...p, initiative } : p))
    );
  };

  const confirmInitiatives = () => {
    if (players.some(p => p.initiative === undefined)) {
       toast({
        title: "Missing Initiatives",
        description: "Please set initiative for all players.",
        variant: "destructive",
      });
      return;
    }
    const sortedPlayers = [...players].sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
    setPlayers(sortedPlayers);
    setStage('PRE_COMBAT');
     toast({
      title: "Initiatives Set",
      description: "Players ordered by initiative. Ready to start!",
    });
  };

  const handleDamageApply = (playerId: string, damage: number) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) =>
        p.id === playerId ? { ...p, currentHp: p.currentHp - damage } : p
      )
    );
    setLastEditedPlayerId(playerId);
  };
  
  const handleHealApply = (playerId: string, heal: number) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) =>
        p.id === playerId ? { ...p, currentHp: Math.min(p.currentHp + heal, p.hp) } : p
      )
    );
    setLastEditedPlayerId(playerId);
  };

  const resetEncounter = () => {
    setPlayers([]);
    setStage('PLAYER_SETUP');
    setLastEditedPlayerId(null);
    toast({
      title: "Encounter Reset",
      description: "Ready to set up a new encounter.",
    });
  };
  
  // Effect to clear highlight after a delay
  useEffect(() => {
    if (lastEditedPlayerId) {
      const timer = setTimeout(() => {
        setLastEditedPlayerId(null);
      }, 3000); // Highlight for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [lastEditedPlayerId]);


  return (
    <div className="container mx-auto p-4 md:p-8 flex-grow font-code">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold">EncounterFlow</h1>
        <p className="text-muted-foreground">D&amp;D Initiative and Combat Tracker</p>
      </header>

      {stage === 'PLAYER_SETUP' && (
        <Card className="mb-8 shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-headline"><UserPlus size={28}/> Add Combatants</CardTitle>
            <CardDescription>Enter player or monster details to add them to the encounter.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerName" className="text-sm font-medium">Name</label>
                <Input id="playerName" value={playerName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)} placeholder="e.g., Aragorn" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerAC" className="text-sm font-medium">Armor Class (AC)</label>
                <Input id="playerAC" type="number" value={playerAC} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerAC(e.target.value)} placeholder="e.g., 18" required min="0"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="playerHP" className="text-sm font-medium">Hit Points (HP)</label>
                <Input id="playerHP" type="number" value={playerHP} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerHP(e.target.value)} placeholder="e.g., 75" required min="1"/>
              </div>
              <Button type="submit" className="w-full sm:w-auto md:self-end h-10">
                <UserPlus className="mr-2 h-4 w-4" /> Add
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
              isHighlighted={false} // No highlighting in setup stages
              onInitiativeChange={handleInitiativeChange}
              onDamageApply={handleDamageApply} // Not used here but prop needed
              onHealApply={handleHealApply} // Not used here
            />
          ))}
        </div>
      )}
      
      {stage === 'PLAYER_SETUP' && players.length > 0 && (
        <div className="text-center mb-8 animate-fade-in">
          <Button onClick={() => { setStage('INITIATIVE_SETUP'); toast({title: "Set Initiatives", description: "Enter initiative scores for each combatant."}); }} size="lg">
            Proceed to Initiative <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {stage === 'INITIATIVE_SETUP' && (
        <div className="text-center mb-8 animate-fade-in">
          <Button onClick={confirmInitiatives} size="lg">
            <ListOrdered className="mr-2 h-5 w-5" /> Confirm Initiatives & Order
          </Button>
        </div>
      )}

      {(stage === 'PRE_COMBAT' || stage === 'COMBAT_ACTIVE') && (
         <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-headline font-semibold mb-3">
            {stage === 'COMBAT_ACTIVE' ? 'Combat Active!' : 'Initiative Order:'}
          </h2>
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              stage={stage}
              isHighlighted={p.id === lastEditedPlayerId}
              onInitiativeChange={handleInitiativeChange} // Not used here
              onDamageApply={handleDamageApply}
              onHealApply={handleHealApply}
            />
          ))}
        </div>
      )}
      
      {stage === 'PRE_COMBAT' && (
        <div className="fixed bottom-6 right-6 animate-fade-in">
          <Button onClick={() => {setStage('COMBAT_ACTIVE'); toast({title: "Encounter Started!", description: "May your dice roll true."});}} size="lg" className="rounded-full w-20 h-20 shadow-2xl text-lg">
            <Play size={36}/>
          </Button>
        </div>
      )}

      {(stage === 'COMBAT_ACTIVE' || stage === 'PRE_COMBAT') && (
         <div className="mt-12 text-center">
            <Button onClick={resetEncounter} variant="outline">
              <ShieldAlert className="mr-2 h-4 w-4" /> Reset Encounter
            </Button>
          </div>
      )}

      {players.length === 0 && stage !== 'PLAYER_SETUP' && (
        <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">No combatants added yet.</p>
            <Button onClick={resetEncounter}>
                Start New Encounter Setup
            </Button>
        </div>
      )}

    </div>
  );
}
