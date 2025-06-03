
'use client';

import type { Player, AppStage } from '@/types';
import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MinusCircle, Skull, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PlayerRowProps {
  player: Player;
  stage: AppStage;
  isHighlighted: boolean;
  onInitiativeChange: (playerId: string, initiative: number) => void;
  onDamageApply: (playerId: string, damage: number) => void;
  onHealApply: (playerId: string, heal: number) => void;
  showDeleteButton?: boolean; 
  onInitiateDelete?: (player: Player) => void; 
  disableCombatActions?: boolean;
  isRosterEditing?: boolean;
  onNameChange?: (playerId: string, newName: string) => void;
}

export function PlayerRow({
  player,
  stage,
  isHighlighted,
  onInitiativeChange,
  onDamageApply,
  onHealApply,
  showDeleteButton = false,
  onInitiateDelete,
  disableCombatActions = false,
  isRosterEditing = false,
  onNameChange,
}: PlayerRowProps) {
  const [initiativeInput, setInitiativeInput] = useState(
    player.initiative === 0 ? '' : (player.initiative?.toString() || '')
  );
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [nameInput, setNameInput] = useState(player.name);
  const { toast } = useToast();

  useEffect(() => {
    setInitiativeInput(
      player.initiative === 0 ? '' : (player.initiative?.toString() || '')
    );
  }, [player.initiative]);

  useEffect(() => {
    setNameInput(player.name);
  }, [player.name]);

  const handleInitiativeBlur = () => {
    const value = parseInt(initiativeInput, 10);
    if (!isNaN(value)) {
      onInitiativeChange(player.id, value);
    } else {
      onInitiativeChange(player.id, 0); 
    }
  };

  const handleDamageSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = parseInt(damageInput, 10);
    if (!isNaN(value) && value > 0) {
      onDamageApply(player.id, value);
      setDamageInput('');
    }
  };
  
  const handleHealSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = parseInt(healInput, 10);
    if (!isNaN(value) && value > 0) {
      onHealApply(player.id, value);
      setHealInput('');
    }
  };

  const handleDeleteClick = () => {
    if (onInitiateDelete) {
      onInitiateDelete(player);
    }
  };

  const handleNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.target.value);
  };

  const handleNameInputBlur = () => {
    if (nameInput.trim() === '') {
      setNameInput(player.name); // Revert if empty
      toast({ title: "Name Cannot Be Empty", description: "Reverted to the original name.", variant: "destructive" });
    } else if (onNameChange && nameInput.trim() !== player.name) {
      onNameChange(player.id, nameInput.trim());
    }
    // If nameInput.trim() === player.name, do nothing
  };


  return (
    <Card 
      className={`transition-all duration-300 ease-in-out mb-3 shadow-md ${isHighlighted ? 'bg-muted ring-2 ring-primary' : 'bg-card'}`}
      data-testid={`player-row-${player.id}`}
    >
      <CardHeader className="pb-2 pt-4 pr-4"> 
        <div className="flex justify-between items-center"> {/* Changed items-start to items-center */}
          <CardTitle className="text-lg font-headline flex items-center w-full">
            {isRosterEditing && onNameChange ? (
              <Input
                value={nameInput}
                onChange={handleNameInputChange}
                onBlur={handleNameInputBlur}
                className="h-8 text-lg font-headline flex-grow p-1 border-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary mr-2"
                aria-label={`Edit name for ${player.name}`}
              />
            ) : (
              <span className="mr-2 truncate">{player.name}</span>
            )}
            {player.currentHp <= 0 && (
              <Skull size={18} className="ml-auto text-destructive shrink-0" aria-label="Downed" />
            )}
          </CardTitle>
          {showDeleteButton && onInitiateDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              className="text-destructive hover:bg-destructive/10 h-8 w-8 ml-2 shrink-0" // Added ml-2 and shrink-0
              aria-label={`Remove ${player.name}`}
            >
              <Trash2 size={18} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center pb-4">
        <div className="text-sm">
          <p>AC: <span className="font-medium">{player.ac}</span></p>
          <p>Max HP: <span className="font-medium">{player.hp}</span></p>
          {stage === 'COMBAT_ACTIVE' && (
            <p>Current HP: <span className={`font-medium ${player.currentHp <= 0 ? 'text-destructive' : ''}`}>{player.currentHp}</span></p>
          )}
          {(stage === 'INITIATIVE_SETUP' || stage === 'PRE_COMBAT') && (
             <p>Initiative: <span className="font-medium">{player.initiative}</span></p>
          )}
           {(stage === 'PLAYER_SETUP') && (
             <p>HP: <span className="font-medium">{player.hp}</span></p>
          )}
        </div>

        {stage === 'INITIATIVE_SETUP' && (
          <div className="md:col-span-2 flex items-center gap-2">
            <label htmlFor={`initiative-${player.id}`} className="text-sm whitespace-nowrap">Initiative:</label>
            <Input
              id={`initiative-${player.id}`}
              type="number"
              value={initiativeInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInitiativeInput(e.target.value)}
              onBlur={handleInitiativeBlur}
              className="w-20 h-9 text-sm"
              aria-label={`Initiative for ${player.name}`}
              disabled={isRosterEditing} // Disable initiative input if roster editing name, etc.
            />
          </div>
        )}

        {stage === 'COMBAT_ACTIVE' && (
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <form onSubmit={handleDamageSubmit} className="flex items-center gap-2">
              <Input
                type="number"
                value={damageInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDamageInput(e.target.value)}
                placeholder="Damage"
                className="w-full sm:w-24 h-9 text-sm"
                aria-label={`Damage for ${player.name}`}
                min="1"
                disabled={player.currentHp <= 0 || disableCombatActions || isRosterEditing}
              />
              {damageInput && player.currentHp > 0 && (
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full h-9 w-9 animate-fade-in" 
                  aria-label="Apply Damage"
                  disabled={disableCombatActions || isRosterEditing}
                >
                  <MinusCircle size={20} />
                </Button>
              )}
            </form>
             <form onSubmit={handleHealSubmit} className="flex items-center gap-2">
              <Input
                type="number"
                value={healInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setHealInput(e.target.value)}
                placeholder="Heal"
                className="w-full sm:w-24 h-9 text-sm"
                aria-label={`Heal for ${player.name}`}
                min="1"
                disabled={disableCombatActions || isRosterEditing}
              />
              {healInput && (
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="outline" 
                  className="rounded-full h-9 w-9 animate-fade-in border-primary text-primary hover:bg-primary/10" 
                  aria-label="Apply Heal"
                  disabled={disableCombatActions || isRosterEditing}
                >
                  <CheckCircle size={20} />
                </Button>
              )}
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
