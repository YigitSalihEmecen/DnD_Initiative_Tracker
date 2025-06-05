'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Monster } from '@/types';

interface MonsterInfoDialogProps {
  monster: Monster | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MonsterInfoDialog({ monster, isOpen, onClose }: MonsterInfoDialogProps) {
  if (!monster) return null;

  const formatAC = (ac: Monster['ac']): string => {
    if (!ac && ac !== 0) return 'Unknown';
    if (typeof ac === 'number') return ac.toString();
    if (Array.isArray(ac) && ac.length > 0) {
      if (typeof ac[0] === 'number') return ac[0].toString();
      if (typeof ac[0] === 'object' && ac[0] && typeof ac[0].ac === 'number') {
        const fromStr = ac[0].from && ac[0].from.length > 0 ? ` (${ac[0].from.join(', ')})` : '';
        return `${ac[0].ac}${fromStr}`;
      }
    }
    if (typeof ac === 'object' && ac !== null && !Array.isArray(ac)) {
      if (typeof (ac as any).ac === 'number') return (ac as any).ac.toString();
    }
    return 'Unknown';
  };

  const formatType = (type: Monster['type']): string => {
    if (typeof type === 'string') return type;
    if (typeof type === 'object') {
      return type.tags ? `${type.type} (${type.tags.join(', ')})` : type.type;
    }
    return 'unknown';
  };

  const formatSize = (size: string[]): string => {
    const sizeMap: { [key: string]: string } = {
      'T': 'Tiny',
      'S': 'Small', 
      'M': 'Medium',
      'L': 'Large',
      'H': 'Huge',
      'G': 'Gargantuan'
    };
    return size.map(s => sizeMap[s] || s).join(', ');
  };

  const formatAlignment = (alignment: string[]): string => {
    const alignmentMap: { [key: string]: string } = {
      'L': 'Lawful',
      'N': 'Neutral', 
      'C': 'Chaotic',
      'G': 'Good',
      'E': 'Evil'
    };
    return alignment.map(a => alignmentMap[a] || a).join(' ');
  };

  const formatSpeed = (speed?: { [key: string]: number | any }): string => {
    if (!speed || typeof speed !== 'object') return 'No speed data';
    
    const entries = Object.entries(speed).filter(([key, value]) => {
      return typeof value === 'number' && value > 0;
    });
    
    if (entries.length === 0) return 'No speed data';
    
    return entries
      .map(([type, value]) => {
        const speedType = type === 'walk' ? '' : `${type} `;
        return `${speedType}${value} ft.`;
      })
      .join(', ');
  };

  const formatAbilityMod = (score?: number): string => {
    if (!score) return '+0';
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const formatCR = (cr: string | { cr: string; lair?: string }): string => {
    if (typeof cr === 'string') return cr;
    if (typeof cr === 'object' && cr.cr) return cr.cr;
    return '?';
  };

  const getCRColor = (cr: string | { cr: string; lair?: string }): string => {
    const crString = formatCR(cr);
    const crNum = parseFloat(crString);
    if (crNum === 0) return 'bg-gray-100 text-gray-800';
    if (crNum <= 0.5) return 'bg-green-100 text-green-800';
    if (crNum <= 2) return 'bg-blue-100 text-blue-800';
    if (crNum <= 5) return 'bg-yellow-100 text-yellow-800';
    if (crNum <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const parseDnDText = (text: string): React.ReactNode => {
    if (!text) return text;

    const parts = text.split(/(\{@[^}]*\}(?:\d+)?)/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\{@([^}]*)\}(\d+)?/);
      if (match) {
        const notation = match[1];
        const number = match[2];
        
        if (notation.startsWith('damage ')) {
          const damage = notation.replace('damage ', '');
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-sm font-mono mx-1">
              {damage}
            </span>
          );
        } else if (notation.startsWith('hit ')) {
          const hitBonus = notation.replace('hit ', '');
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-sm font-bold mx-1">
              +{hitBonus}
            </span>
          );
        } else if (notation === 'h' && number) {
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-bold mx-1">
              {number}
            </span>
          );
        } else if (notation.startsWith('dc ')) {
          const dc = notation.replace('dc ', '');
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-sm font-bold mx-1">
              DC {dc}
            </span>
          );
        } else if (notation === 'atk mw') {
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-xs font-semibold mx-1">
              Melee Weapon Attack
            </span>
          );
        } else if (notation === 'atk rw') {
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-xs font-semibold mx-1">
              Ranged Weapon Attack
            </span>
          );
        } else if (notation === 'atk rs') {
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs font-semibold mx-1">
              Ranged Spell Attack
            </span>
          );
        } else if (notation === 'atk ms') {
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs font-semibold mx-1">
              Melee Spell Attack
            </span>
          );
        } else if (notation.startsWith('dice ')) {
          const dice = notation.replace('dice ', '');
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-sm font-mono mx-1">
              {dice}
            </span>
          );
        } else if (notation.startsWith('condition ')) {
          const condition = notation.replace('condition ', '');
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-pink-100 text-pink-800 text-xs font-medium mx-1 capitalize">
              {condition}
            </span>
          );
        } else if (notation.startsWith('spell ')) {
          const spell = notation.replace('spell ', '');
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-violet-100 text-violet-800 text-xs font-medium mx-1 italic">
              {spell}
            </span>
          );
        } else {
          return (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium mx-1">
              {notation}
            </span>
          );
        }
      }
      return part;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{monster.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg text-muted-foreground">
                    {formatSize(monster.size)} {formatType(monster.type)}, {formatAlignment(monster.alignment)}
                  </p>
                </div>
                <Badge className={`${getCRColor(monster.cr)} border-0 text-base px-3 py-1`}>
                  CR {formatCR(monster.cr)}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Basic Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Armor Class:</strong> {formatAC(monster.ac)}</p>
                  <p><strong>Hit Points:</strong> {monster.hp?.average || 'Unknown'} {monster.hp?.formula ? `(${monster.hp.formula})` : ''}</p>
                  <p><strong>Speed:</strong> {formatSpeed(monster.speed)}</p>
                </div>
                <div>
                  {monster.passive && <p><strong>Passive Perception:</strong> {monster.passive}</p>}
                  {monster.languages && <p><strong>Languages:</strong> {monster.languages.join(', ')}</p>}
                  <p><strong>Source:</strong> {monster.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ability Scores */}
          {(monster.str || monster.dex || monster.con || monster.int || monster.wis || monster.cha) && (
            <Card>
              <CardHeader>
                <CardTitle>Ability Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="font-semibold">STR</p>
                    <p className="text-lg">{monster.str ?? '?'}</p>
                    <p className="text-sm text-muted-foreground">({formatAbilityMod(monster.str)})</p>
                  </div>
                  <div>
                    <p className="font-semibold">DEX</p>
                    <p className="text-lg">{monster.dex ?? '?'}</p>
                    <p className="text-sm text-muted-foreground">({formatAbilityMod(monster.dex)})</p>
                  </div>
                  <div>
                    <p className="font-semibold">CON</p>
                    <p className="text-lg">{monster.con ?? '?'}</p>
                    <p className="text-sm text-muted-foreground">({formatAbilityMod(monster.con)})</p>
                  </div>
                  <div>
                    <p className="font-semibold">INT</p>
                    <p className="text-lg">{monster.int ?? '?'}</p>
                    <p className="text-sm text-muted-foreground">({formatAbilityMod(monster.int)})</p>
                  </div>
                  <div>
                    <p className="font-semibold">WIS</p>
                    <p className="text-lg">{monster.wis ?? '?'}</p>
                    <p className="text-sm text-muted-foreground">({formatAbilityMod(monster.wis)})</p>
                  </div>
                  <div>
                    <p className="font-semibold">CHA</p>
                    <p className="text-lg">{monster.cha ?? '?'}</p>
                    <p className="text-sm text-muted-foreground">({formatAbilityMod(monster.cha)})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills & Saves */}
          {(monster.skill || monster.save) && (
            <Card>
              <CardHeader>
                <CardTitle>Skills & Saves</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {monster.save && (
                  <p><strong>Saving Throws:</strong> {Object.entries(monster.save).map(([ability, bonus]) => `${ability.toUpperCase()} ${bonus}`).join(', ')}</p>
                )}
                {monster.skill && (
                  <p><strong>Skills:</strong> {Object.entries(monster.skill).map(([skill, bonus]) => `${skill} ${bonus}`).join(', ')}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Traits */}
          {monster.trait && monster.trait.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Traits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monster.trait.map((trait, index) => (
                  <div key={index}>
                    <p className="font-semibold text-base mb-2">{trait.name}</p>
                    <div className="text-sm leading-relaxed">
                      {trait.entries.map((entry, entryIndex) => (
                        <p key={entryIndex} className="mb-2">
                          {parseDnDText(entry)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {monster.action && monster.action.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monster.action.map((action, index) => (
                  <div key={index}>
                    <p className="font-semibold text-base mb-2">{action.name}</p>
                    <div className="text-sm leading-relaxed">
                      {action.entries.map((entry, entryIndex) => (
                        <p key={entryIndex} className="mb-2">
                          {parseDnDText(entry)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 