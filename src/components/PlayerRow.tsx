
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
  onAcChange?: (playerId: string, newAc: number) => void;
  onMaxHpChange?: (playerId: string, newMaxHp: number) => void;
  onCurrentHpChange?: (playerId: string, newCurrentHp: number) => void;
  isReviewMode?: boolean;
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
  onAcChange,
  onMaxHpChange,
  onCurrentHpChange,
  isReviewMode = false,
}: PlayerRowProps) {
  const [initiativeInput, setInitiativeInput] = useState(
    player.initiative === 0 ? '' : (player.initiative?.toString() || '')
  );
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [nameInput, setNameInput] = useState(player.name);
  const [acInput, setAcInput] = useState(player.ac.toString());
  const [maxHpInput, setMaxHpInput] = useState(player.hp.toString());
  const [currentHpInput, setCurrentHpInput] = useState(player.currentHp.toString());

  const { toast } = useToast();

  useEffect(() => {
    setInitiativeInput(
      player.initiative === 0 ? '' : (player.initiative?.toString() || '')
    );
  }, [player.initiative]);

  useEffect(() => {
    setNameInput(player.name);
  }, [player.name]);

  useEffect(() => {
    setAcInput(player.ac.toString());
  }, [player.ac]);

  useEffect(() => {
    setMaxHpInput(player.hp.toString());
  }, [player.hp]);

  useEffect(() => {
    setCurrentHpInput(player.currentHp.toString());
  }, [player.currentHp]);


  const handleInitiativeBlur = () => {
    if (isReviewMode) return;
    const value = parseInt(initiativeInput, 10);
    if (!isNaN(value)) {
      onInitiativeChange(player.id, value);
    } else {
      onInitiativeChange(player.id, 0); 
    }
  };

  const handleDamageSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isReviewMode) return;
    const value = parseInt(damageInput, 10);
    if (!isNaN(value) && value > 0) {
      onDamageApply(player.id, value);
      setDamageInput('');
    }
  };
  
  const handleHealSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isReviewMode) return;
    const value = parseInt(healInput, 10);
    if (!isNaN(value) && value > 0) {
      onHealApply(player.id, value);
      setHealInput('');
    }
  };

  const handleDeleteClick = () => {
    if (isReviewMode || !onInitiateDelete) return;
    onInitiateDelete(player);
  };

  const handleNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isReviewMode) return;
    setNameInput(e.target.value);
  };

  const handleNameInputBlur = () => {
    if (isReviewMode) return;
    if (nameInput.trim() === '') {
      setNameInput(player.name); 
      toast({ title: "Name Cannot Be Empty", description: "Reverted to the original name.", variant: "destructive" });
    } else if (onNameChange && nameInput.trim() !== player.name) {
      onNameChange(player.id, nameInput.trim());
    }
  };

  const handleAcInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isReviewMode) return;
    setAcInput(e.target.value);
  };

  const handleAcInputBlur = () => {
    if (isReviewMode || !onAcChange) return;
    const newAc = parseInt(acInput, 10);
    if (isNaN(newAc) || newAc < 0) {
      setAcInput(player.ac.toString());
      toast({ title: "Invalid AC", description: "AC must be a non-negative number. Reverted.", variant: "destructive" });
    } else if (newAc !== player.ac) {
      onAcChange(player.id, newAc);
    }
  };

  const handleMaxHpInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isReviewMode) return;
    setMaxHpInput(e.target.value);
  };

  const handleMaxHpInputBlur = () => {
    if (isReviewMode || !onMaxHpChange) return;
    const newMaxHp = parseInt(maxHpInput, 10);
    if (isNaN(newMaxHp) || newMaxHp <= 0) {
      setMaxHpInput(player.hp.toString());
      toast({ title: "Invalid Max HP", description: "Max HP must be a positive number. Reverted.", variant: "destructive" });
    } else if (newMaxHp !== player.hp) {
      onMaxHpChange(player.id, newMaxHp);
    }
  };

  const handleCurrentHpInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isReviewMode) return;
    setCurrentHpInput(e.target.value);
  };

  const handleCurrentHpInputBlur = () => {
    if (isReviewMode || !onCurrentHpChange) return;
    const newCurrentHp = parseInt(currentHpInput, 10);
    if (isNaN(newCurrentHp) || newCurrentHp < 0) {
      setCurrentHpInput(player.currentHp.toString());
      toast({ title: "Invalid Current HP", description: "Current HP must be a non-negative number. Reverted.", variant: "destructive" });
    } else if (newCurrentHp > player.hp) {
      setCurrentHpInput(player.hp.toString()); // Cap at Max HP
      toast({ title: "Invalid Current HP", description: `Current HP cannot exceed Max HP (${player.hp}). Reverted.`, variant: "destructive" });
    } else if (newCurrentHp !== player.currentHp) {
      onCurrentHpChange(player.id, newCurrentHp);
    }
  };


  return (
    <Card 
      className={`transition-all duration-300 ease-in-out mb-3 shadow-md ${isHighlighted ? 'bg-muted ring-2 ring-primary' : 'bg-card'}`}
      data-testid={`player-row-${player.id}`}
    >
      <CardHeader className="pb-2 pt-4 pr-4"> 
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-headline flex items-center w-full">
            {isReviewMode ? (
              <span className="mr-2 truncate">{player.name}</span>
            ) : isRosterEditing && onNameChange ? (
              <Input
                value={nameInput}
                onChange={handleNameInputChange}
                onBlur={handleNameInputBlur}
                className="h-8 text-lg font-headline flex-grow p-1 border-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary mr-2"
                aria-label={`Edit name for ${player.name}`}
                disabled={isReviewMode}
              />
            ) : (
              <span className="mr-2 truncate">{player.name}</span>
            )}
            {player.currentHp <= 0 && (
              <Skull size={18} className="ml-auto text-destructive shrink-0" aria-label="Downed" />
            )}
          </CardTitle>
          {!isReviewMode && showDeleteButton && onInitiateDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              className="text-destructive hover:bg-destructive/10 h-8 w-8 ml-2 shrink-0"
              aria-label={`Remove ${player.name}`}
            >
              <Trash2 size={18} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center pb-4">
        <div className="text-sm space-y-1">
          {!isReviewMode && isRosterEditing && onAcChange ? (
            <div className="flex items-center gap-2">
              <label htmlFor={`ac-${player.id}`} className="font-medium whitespace-nowrap">AC:</label>
              <Input 
                id={`ac-${player.id}`}
                type="number" 
                value={acInput} 
                onChange={handleAcInputChange} 
                onBlur={handleAcInputBlur} 
                className="w-16 h-8 text-sm p-1"
                aria-label={`Edit AC for ${player.name}`}
                min="0"
              />
            </div>
          ) : (
            <p>AC: <span className="font-medium">{player.ac}</span></p>
          )}

          {!isReviewMode && isRosterEditing && onMaxHpChange ? (
            <div className="flex items-center gap-2">
              <label htmlFor={`max-hp-${player.id}`} className="font-medium whitespace-nowrap">Max HP:</label>
              <Input 
                id={`max-hp-${player.id}`}
                type="number" 
                value={maxHpInput} 
                onChange={handleMaxHpInputChange} 
                onBlur={handleMaxHpInputBlur} 
                className="w-20 h-8 text-sm p-1"
                aria-label={`Edit Max HP for ${player.name}`}
                min="1"
              />
            </div>
          ) : (
            <p>Max HP: <span className="font-medium">{player.hp}</span></p>
          )}
          
          {(stage === 'COMBAT_ACTIVE' || isReviewMode || (isRosterEditing && !isReviewMode)) && (
            !isReviewMode && isRosterEditing && onCurrentHpChange ? (
              <div className="flex items-center gap-2">
                <label htmlFor={`current-hp-${player.id}`} className="font-medium whitespace-nowrap">Current HP:</label>
                <Input 
                  id={`current-hp-${player.id}`}
                  type="number" 
                  value={currentHpInput} 
                  onChange={handleCurrentHpInputChange} 
                  onBlur={handleCurrentHpInputBlur} 
                  className={`w-20 h-8 text-sm p-1 ${parseInt(currentHpInput, 10) <= 0 ? 'text-destructive' : ''}`}
                  aria-label={`Edit Current HP for ${player.name}`}
                  min="0"
                />
              </div>
            ) : (
              <p>Current HP: <span className={`font-medium ${player.currentHp <= 0 ? 'text-destructive' : ''}`}>{player.currentHp}</span></p>
            )
          )}

          {(stage === 'INITIATIVE_SETUP' || stage === 'PRE_COMBAT' || (isReviewMode && player.initiative !== undefined) ) && (
             <p>Initiative: <span className="font-medium">{player.initiative}</span></p>
          )}
           {(stage === 'PLAYER_SETUP' && !isReviewMode && !isRosterEditing) && ( 
             <p>HP: <span className="font-medium">{player.hp}</span></p>
          )}
        </div>

        {!isReviewMode && stage === 'INITIATIVE_SETUP' && !isRosterEditing && (
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
              disabled={isRosterEditing}
            />
          </div>
        )}

        {!isReviewMode && stage === 'COMBAT_ACTIVE' && !isRosterEditing && (
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

