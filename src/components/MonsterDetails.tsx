'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Player, Monster } from '@/types';

interface MonsterDetailsProps {
  monster: Monster;
  onBack: () => void;
  onAddMonster: (monster: Player) => void;
}

export default function MonsterDetails({ monster, onBack, onAddMonster }: MonsterDetailsProps) {
  const formatAC = (ac: Monster['ac']): string => {
    if (typeof ac === 'number') return ac.toString();
    if (Array.isArray(ac)) {
      if (typeof ac[0] === 'number') return ac[0].toString();
      if (typeof ac[0] === 'object') return `${ac[0].ac} (${ac[0].from.join(', ')})`;
    }
    return '?';
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

  const formatSpeed = (speed?: { [key: string]: number }): string => {
    if (!speed) return 'No speed data';
    return Object.entries(speed)
      .map(([type, value]) => `${type} ${value} ft.`)
      .join(', ');
  };

  const formatAbilityMod = (score?: number): string => {
    if (score === undefined) return '?';
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getCRColor = (cr: string): string => {
    const crNum = parseFloat(cr);
    if (crNum === 0) return 'bg-gray-100 text-gray-800';
    if (crNum <= 0.5) return 'bg-green-100 text-green-800';
    if (crNum <= 2) return 'bg-blue-100 text-blue-800';
    if (crNum <= 5) return 'bg-yellow-100 text-yellow-800';
    if (crNum <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const handleAddToEncounter = () => {
    // Convert monster to Player format
    const ac = typeof monster.ac === 'number' ? monster.ac : 
               Array.isArray(monster.ac) ? 
                 (typeof monster.ac[0] === 'number' ? monster.ac[0] : monster.ac[0].ac) : 
                 10;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: monster.name,
      ac: ac,
      hp: monster.hp.average,
      currentHp: monster.hp.average,
      initiative: 0,
    };

    onAddMonster(newPlayer);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex-grow font-code animate-fade-in">
      {/* Back button at top center */}
      <div className="flex justify-center mb-8">
        <Button 
          onClick={onBack} 
          className="h-12 w-12 rounded-xl bg-black text-white hover:bg-gray-800 border-0"
          aria-label="Back to bestiary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-headline mb-2">{monster.name}</CardTitle>
                <p className="text-lg text-muted-foreground">
                  {formatSize(monster.size)} {formatType(monster.type)}, {formatAlignment(monster.alignment)}
                </p>
              </div>
              <Badge className={`${getCRColor(monster.cr)} border-0 text-base px-3 py-1`}>
                CR {monster.cr}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Basic Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Armor Class:</strong> {formatAC(monster.ac)}</p>
                <p><strong>Hit Points:</strong> {monster.hp.average} ({monster.hp.formula})</p>
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
          <Card className="mb-6">
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
          <Card className="mb-6">
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Traits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {monster.trait.map((trait, index) => (
                <div key={index}>
                  <p className="font-semibold">{trait.name}</p>
                  <div className="text-sm text-muted-foreground">
                    {trait.entries.map((entry, entryIndex) => (
                      <p key={entryIndex}>{entry}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {monster.action && monster.action.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {monster.action.map((action, index) => (
                <div key={index}>
                  <p className="font-semibold">{action.name}</p>
                  <div className="text-sm text-muted-foreground">
                    {action.entries.map((entry, entryIndex) => (
                      <p key={entryIndex}>{entry}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add to Encounter Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleAddToEncounter}
            size="lg"
            className="h-12 px-8 text-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add to Encounter
          </Button>
        </div>
      </div>
    </div>
  );
} 