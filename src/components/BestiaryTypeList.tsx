'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Monster } from '@/types';

interface MonsterTypeData {
  type: string;
  count: number;
  description: string;
  icon: string;
}

interface BestiaryTypeListProps {
  onSelectType: (type: string, monsters: Monster[]) => void;
  onBack: () => void;
}

export default function BestiaryTypeList({ onSelectType, onBack }: BestiaryTypeListProps) {
  const [allMonsters, setAllMonsters] = useState<Monster[]>([]);
  const [monsterTypes, setMonsterTypes] = useState<MonsterTypeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<MonsterTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Major bestiary files to load (prioritizing main books)
  const bestiaryFiles = [
    'bestiary-mpmm.json',    // Mordenkainen Presents: Monsters of the Multiverse (replaces MM)
    'bestiary-vgm.json',     // Volo's Guide to Monsters  
    'bestiary-mtf.json',     // Mordenkainen's Tome of Foes
    'bestiary-ftd.json',     // Fizban's Treasury of Dragons
    'bestiary-phb.json',     // Player's Handbook monsters
    'bestiary-cos.json',     // Curse of Strahd
    'bestiary-pota.json',    // Princes of the Apocalypse
    'bestiary-skt.json',     // Storm King's Thunder
    'bestiary-toa.json',     // Tomb of Annihilation
    'bestiary-wdh.json',     // Waterdeep: Dragon Heist
    'bestiary-wdmm.json',    // Waterdeep: Dungeon of the Mad Mage
    'bestiary-idrotf.json',  // Icewind Dale: Rime of the Frostmaiden
    'bestiary-mot.json',     // Mythic Odysseys of Theros
    'bestiary-erlw.json',    // Eberron: Rising from the Last War
    'bestiary-ggr.json',     // Guildmasters' Guide to Ravnica
    'bestiary-egw.json',     // Explorer's Guide to Wildemount
    'bestiary-tftyp.json',   // Tales from the Yawning Portal
    'bestiary-oota.json',    // Out of the Abyss
    'bestiary-scc.json',     // Strixhaven: A Curriculum of Chaos
    'bestiary-bam.json',     // Book of Many Things
    'bestiary-gos.json',     // Ghosts of Saltmarsh
    'bestiary-bgg.json',     // Bigby's Glory of the Giants
    'bestiary-dsotdq.json',  // Dragonlance: Shadow of the Dragon Queen
  ];

  useEffect(() => {
    loadAllMonsters();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = monsterTypes.filter(type =>
        type.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTypes(filtered);
    } else {
      setFilteredTypes(monsterTypes);
    }
  }, [searchTerm, monsterTypes]);

  const loadAllMonsters = async () => {
    try {
      setIsLoading(true);
      console.log('Loading monsters from all bestiary files...');
      
      const allMonsters: Monster[] = [];
      
      // Get the base path for production (GitHub Pages)
      const basePath = process.env.NODE_ENV === 'production' ? '/DnD_Initiative_Tracker' : '';
      
      // Load monsters from each bestiary file
      for (const file of bestiaryFiles) {
        try {
          const response = await fetch(`${basePath}/${file}`);
          console.log(`Fetching: ${basePath}/${file} - Status: ${response.status}`);
          if (response.ok) {
            const data = await response.json();
            if (data.monster && Array.isArray(data.monster)) {
              allMonsters.push(...data.monster);
            }
          } else {
            console.warn(`Failed to fetch ${file}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.warn(`Failed to load ${file}:`, error);
          // Continue loading other files even if one fails
        }
      }
      
      console.log(`Loaded ${allMonsters.length} total monsters`);
      setAllMonsters(allMonsters);
      
      // Group monsters by type with proper null checks
      const typeGroups: { [key: string]: Monster[] } = {};
      
      allMonsters.forEach(monster => {
        // Handle different type formats and null checks
        let monsterType: string;
        
        if (!monster.type) {
          monsterType = 'Unknown';
        } else if (typeof monster.type === 'string') {
          monsterType = monster.type;
        } else if (typeof monster.type === 'object' && monster.type.type) {
          monsterType = monster.type.type;
        } else {
          monsterType = 'Unknown';
        }
        
        // Capitalize first letter
        monsterType = monsterType.charAt(0).toUpperCase() + monsterType.slice(1).toLowerCase();
        
        if (!typeGroups[monsterType]) {
          typeGroups[monsterType] = [];
        }
        typeGroups[monsterType].push(monster);
      });
      
      // Convert to type data with descriptions and icons
      const types: MonsterTypeData[] = Object.entries(typeGroups).map(([type, monsters]) => ({
        type,
        count: monsters.length,
        description: getTypeDescription(type),
        icon: getTypeIcon(type)
      }));
      
      // Sort by count (most common types first)
      types.sort((a, b) => b.count - a.count);
      
      setMonsterTypes(types);
      setFilteredTypes(types);
    } catch (error) {
      console.error('Error loading bestiary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectType = (selectedType: string) => {
    try {
      console.log('Selecting type:', selectedType);
      console.log('All monsters count:', allMonsters.length);
      
      // Safety check - ensure we have monsters loaded
      if (!allMonsters || allMonsters.length === 0) {
        console.error('No monsters loaded yet, cannot filter by type');
        return;
      }
      
      const monstersOfType = allMonsters.filter(monster => {
        // Additional safety check for individual monster
        if (!monster) {
          console.warn('Found null/undefined monster in array');
          return false;
        }
        
        // Use same type extraction logic as in loadAllMonsters
        let monsterType: string;
        
        if (!monster.type) {
          monsterType = 'Unknown';
        } else if (typeof monster.type === 'string') {
          monsterType = monster.type;
        } else if (typeof monster.type === 'object' && monster.type.type) {
          monsterType = monster.type.type;
        } else {
          monsterType = 'Unknown';
        }
        
        // Capitalize first letter to match format
        monsterType = monsterType.charAt(0).toUpperCase() + monsterType.slice(1).toLowerCase();
        
        return monsterType === selectedType;
      }).sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Found ${monstersOfType.length} monsters of type ${selectedType}`);
      
      if (monstersOfType.length === 0) {
        console.warn(`No monsters found for type: ${selectedType}`);
      }

      onSelectType(selectedType, monstersOfType);
    } catch (error) {
      console.error('Error in handleSelectType:', error);
      // Don't proceed if there's an error
    }
  };

  const getTypeDescription = (type: string): string => {
    const descriptions: { [key: string]: string } = {
      'Aberration': 'Alien entities from beyond reality',
      'Beast': 'Natural animals and creatures',
      'Celestial': 'Angels and divine beings',
      'Construct': 'Animated objects and golems',
      'Dragon': 'Ancient, powerful reptilian creatures',
      'Elemental': 'Beings of pure elemental force',
      'Fey': 'Magical creatures from the Feywild',
      'Fiend': 'Devils, demons, and evil outsiders',
      'Giant': 'Large humanoid creatures',
      'Humanoid': 'People and human-like beings',
      'Monstrosity': 'Unnatural creatures and hybrids',
      'Ooze': 'Formless, gelatinous creatures',
      'Plant': 'Animated vegetation and plant life',
      'Undead': 'Creatures returned from death',
      'Unknown': 'Creatures of uncertain classification'
    };
    return descriptions[type] || 'Various creatures';
  };

  const getTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'Aberration': '🐙',
      'Beast': '🐺',
      'Celestial': '👼',
      'Construct': '🤖',
      'Dragon': '🐉',
      'Elemental': '⚡',
      'Fey': '🧚',
      'Fiend': '👹',
      'Giant': '🗿',
      'Humanoid': '👤',
      'Monstrosity': '👾',
      'Ooze': '🟢',
      'Plant': '🌿',
      'Undead': '💀',
      'Unknown': '❓'
    };
    return icons[type] || '❓';
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
          <p className="text-lg mb-4">Loading bestiary from all sourcebooks...</p>
          <p className="text-sm text-muted-foreground">This may take a moment as we load thousands of monsters</p>
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
        <p className="text-muted-foreground">Choose a creature type to browse</p>
        <p className="text-sm text-muted-foreground mt-2">
          {allMonsters.length.toLocaleString()} monsters loaded from official D&D sourcebooks
        </p>
      </header>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search creature types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Monster Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTypes.map((typeData) => (
          <Card 
            key={typeData.type}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => handleSelectType(typeData.type)}
          >
            <CardHeader className="text-center pb-4">
              <div className="text-4xl mb-2">{typeData.icon}</div>
              <CardTitle className="text-2xl">{typeData.type}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">{typeData.description}</p>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {typeData.count.toLocaleString()} creatures
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No creature types found matching your search.</p>
        </div>
      )}
    </div>
  );
} 