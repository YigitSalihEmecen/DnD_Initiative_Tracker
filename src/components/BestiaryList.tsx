'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Monster } from '@/types';

interface BestiaryListProps {
  onSelectMonster: (monster: Monster) => void;
  onBack: () => void;
}

export default function BestiaryList({ onSelectMonster, onBack }: BestiaryListProps) {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [filteredMonsters, setFilteredMonsters] = useState<Monster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMonsters();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = monsters.filter(monster =>
        monster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monster.cr.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMonsters(filtered);
    } else {
      setFilteredMonsters(monsters);
    }
  }, [searchTerm, monsters]);

  const loadMonsters = async () => {
    try {
      setIsLoading(true);
      // Load Monster Manual first (most common monsters)
      const response = await fetch('/bestiary/bestiary-mm.json');
      const data = await response.json();
      
      if (data.monster && Array.isArray(data.monster)) {
        // Sort monsters alphabetically
        const sortedMonsters = data.monster.sort((a: Monster, b: Monster) => 
          a.name.localeCompare(b.name)
        );
        setMonsters(sortedMonsters);
        setFilteredMonsters(sortedMonsters);
      }
    } catch (error) {
      console.error('Error loading bestiary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAC = (ac: Monster['ac']): string => {
    if (typeof ac === 'number') return ac.toString();
    if (Array.isArray(ac)) {
      if (typeof ac[0] === 'number') return ac[0].toString();
      if (typeof ac[0] === 'object') return ac[0].ac.toString();
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

  const getCRColor = (cr: string): string => {
    const crNum = parseFloat(cr);
    if (crNum === 0) return 'bg-gray-100 text-gray-800';
    if (crNum <= 0.5) return 'bg-green-100 text-green-800';
    if (crNum <= 2) return 'bg-blue-100 text-blue-800';
    if (crNum <= 5) return 'bg-yellow-100 text-yellow-800';
    if (crNum <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex-grow font-code animate-fade-in">
        <div className="flex justify-center mb-8">
          <Button 
            onClick={onBack} 
            className="h-12 w-12 rounded-xl bg-black text-white hover:bg-gray-800 border-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-lg">Loading bestiary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex-grow font-code animate-fade-in">
      {/* Back button at top center */}
      <div className="flex justify-center mb-8">
        <Button 
          onClick={onBack} 
          className="h-12 w-12 rounded-xl bg-black text-white hover:bg-gray-800 border-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold">Bestiary</h1>
        <p className="text-muted-foreground">Choose a monster to add to your encounter</p>
      </header>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search monsters by name, source, or challenge rating..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Monsters List */}
      <div className="grid gap-4">
        {filteredMonsters.length > 0 ? (
          filteredMonsters.map((monster, index) => (
            <Card 
              key={`${monster.name}-${index}`}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => onSelectMonster(monster)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-primary mb-1">{monster.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatSize(monster.size)} {formatType(monster.type)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span><strong>AC:</strong> {formatAC(monster.ac)}</span>
                      <span><strong>HP:</strong> {monster.hp.average}</span>
                      <span><strong>Source:</strong> {monster.source}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <Badge className={`${getCRColor(monster.cr)} border-0`}>
                      CR {monster.cr}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No monsters found matching your search.</p>
          </div>
        )}
      </div>
      
      {filteredMonsters.length > 0 && (
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Showing {filteredMonsters.length} of {monsters.length} monsters
        </div>
      )}
    </div>
  );
} 