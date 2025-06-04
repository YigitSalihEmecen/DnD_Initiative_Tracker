'use client';

import type { Player, AppStage } from '@/types';
import { useState, type ChangeEvent, type FormEvent, useEffect, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MinusCircle, Skull, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStageBadgeClass } from '@/lib/ui-utils';

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
  const [editingName, setEditingName] = useState(player.name);
  const [editingAc, setEditingAc] = useState(player.ac.toString());
  const [editingMaxHp, setEditingMaxHp] = useState(player.hp.toString());
  const [editingCurrentHp, setEditingCurrentHp] = useState(player.currentHp.toString());
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAc, setIsEditingAc] = useState(false);
  const [isEditingMaxHp, setIsEditingMaxHp] = useState(false);
  const [isEditingCurrentHp, setIsEditingCurrentHp] = useState(false);

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

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditingName(newName);
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditingName(player.name);
      setIsEditingName(false);
    }
  };

  const handleNameBlur = () => {
    if (editingName.trim() === '') {
      setEditingName(player.name);
      setIsEditingName(false);
      return;
    }
    if (onNameChange) {
      onNameChange(player.id, editingName.trim());
    }
    setIsEditingName(false);
  };

  const handleAcChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newAc = e.target.value;
    setEditingAc(newAc);
  };

  const handleAcKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAcBlur();
    } else if (e.key === 'Escape') {
      setEditingAc(player.ac.toString());
      setIsEditingAc(false);
    }
  };

  const handleAcBlur = () => {
    const newAcValue = parseInt(editingAc, 10);
    if (isNaN(newAcValue) || newAcValue < 0) {
      setEditingAc(player.ac.toString());
      setIsEditingAc(false);
      return;
    }
    if (onAcChange) {
      onAcChange(player.id, newAcValue);
    }
    setIsEditingAc(false);
  };

  const handleMaxHpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newMaxHp = e.target.value;
    setEditingMaxHp(newMaxHp);
  };

  const handleMaxHpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMaxHpBlur();
    } else if (e.key === 'Escape') {
      setEditingMaxHp(player.hp.toString());
      setIsEditingMaxHp(false);
    }
  };

  const handleMaxHpBlur = () => {
    const newMaxHpValue = parseInt(editingMaxHp, 10);
    if (isNaN(newMaxHpValue) || newMaxHpValue <= 0) {
      setEditingMaxHp(player.hp.toString());
      setIsEditingMaxHp(false);
      return;
    }
    if (onMaxHpChange) {
      onMaxHpChange(player.id, newMaxHpValue);
    }
    setIsEditingMaxHp(false);
  };

  const handleCurrentHpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newCurrentHp = e.target.value;
    setEditingCurrentHp(newCurrentHp);
  };

  const handleCurrentHpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCurrentHpBlur();
    } else if (e.key === 'Escape') {
      setEditingCurrentHp(player.currentHp.toString());
      setIsEditingCurrentHp(false);
    }
  };

  const handleCurrentHpBlur = () => {
    const newCurrentHpValue = parseInt(editingCurrentHp, 10);
    if (isNaN(newCurrentHpValue) || newCurrentHpValue < 0) {
      setEditingCurrentHp(player.currentHp.toString());
      setIsEditingCurrentHp(false);
      return;
    }
    if (newCurrentHpValue > player.hp) {
      setEditingCurrentHp(player.currentHp.toString());
      setIsEditingCurrentHp(false);
      return;
    }
    if (onCurrentHpChange) {
      onCurrentHpChange(player.id, newCurrentHpValue);
    }
    setIsEditingCurrentHp(false);
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
                value={editingName}
                onChange={handleNameChange}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameBlur}
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
                value={editingAc} 
                onChange={handleAcChange} 
                onKeyDown={handleAcKeyDown} 
                onBlur={handleAcBlur} 
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
                value={editingMaxHp} 
                onChange={handleMaxHpChange} 
                onKeyDown={handleMaxHpKeyDown} 
                onBlur={handleMaxHpBlur} 
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
                  value={editingCurrentHp} 
                  onChange={handleCurrentHpChange} 
                  onKeyDown={handleCurrentHpKeyDown} 
                  onBlur={handleCurrentHpBlur} 
                  className={`w-20 h-8 text-sm p-1 ${parseInt(editingCurrentHp, 10) <= 0 ? 'text-destructive' : ''}`}
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

