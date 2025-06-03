
'use client';

import type { Player, AppStage } from '@/types';
import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MinusCircle, Trash2 } from 'lucide-react';

interface PlayerRowProps {
  player: Player;
  stage: AppStage;
  isHighlighted: boolean;
  onInitiativeChange: (playerId: string, initiative: number) => void;
  onDamageApply: (playerId: string, damage: number) => void;
  onHealApply: (playerId: string, heal: number) => void;
  showDeleteButton?: boolean; // Optional: controls visibility of delete button
  onInitiateDelete?: (player: Player) => void; // Optional: callback to initiate deletion
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
}: PlayerRowProps) {
  const [initiativeInput, setInitiativeInput] = useState(
    player.initiative === 0 ? '' : (player.initiative?.toString() || '')
  );
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');

  useEffect(() => {
    setInitiativeInput(
      player.initiative === 0 ? '' : (player.initiative?.toString() || '')
    );
  }, [player.initiative]);

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

  return (
    <Card 
      className={`transition-all duration-300 ease-in-out mb-3 shadow-md ${isHighlighted ? 'bg-muted ring-2 ring-primary' : 'bg-card'}`}
      data-testid={`player-row-${player.id}`}
    >
      <CardHeader className="pb-2 pt-4 pr-4"> 
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline">{player.name}</CardTitle>
          {showDeleteButton && onInitiateDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              className="text-destructive hover:bg-destructive/10 h-8 w-8"
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
              />
              {damageInput && (
                <Button type="submit" size="icon" className="rounded-full h-9 w-9 animate-fade-in" aria-label="Apply Damage">
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
              />
              {healInput && (
                <Button type="submit" size="icon" variant="outline" className="rounded-full h-9 w-9 animate-fade-in border-primary text-primary hover:bg-primary/10" aria-label="Apply Heal">
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
