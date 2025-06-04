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

  // Load all available bestiary files dynamically
  const [bestiaryFiles, setBestiaryFiles] = useState<string[]>([]);

  useEffect(() => {
    // First discover all bestiary files, then load monsters
    discoverBestiaryFiles();
  }, []);

  useEffect(() => {
    // Load monsters when bestiary files are discovered
    if (bestiaryFiles.length > 0) {
      loadAllMonsters();
    }
  }, [bestiaryFiles]);

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

  const discoverBestiaryFiles = async () => {
    try {
      // Get the base path for production (GitHub Pages)
      const basePath = process.env.NODE_ENV === 'production' ? '/DnD_Initiative_Tracker' : '';
      
      // Try to fetch a directory listing or use a predefined list
      // Since we can't list directory contents via HTTP, we'll try to fetch known files
      // and filter out the ones that don't exist
      const potentialFiles = [
        'bestiary-aatm.json', 'bestiary-ai.json', 'bestiary-aitfr-dn.json', 'bestiary-aitfr-fcd.json',
        'bestiary-aitfr-isf.json', 'bestiary-aitfr-thp.json', 'bestiary-awm.json', 'bestiary-bam.json',
        'bestiary-bgdia.json', 'bestiary-bgg.json', 'bestiary-bmt.json', 'bestiary-cm.json',
        'bestiary-coa.json', 'bestiary-cos.json', 'bestiary-crcotn.json', 'bestiary-dc.json',
        'bestiary-dip.json', 'bestiary-ditlcot.json', 'bestiary-dmg.json', 'bestiary-dod.json',
        'bestiary-dodk.json', 'bestiary-dosi.json', 'bestiary-dsotdq.json', 'bestiary-egw.json',
        'bestiary-erlw.json', 'bestiary-esk.json', 'bestiary-ftd.json', 'bestiary-ggr.json',
        'bestiary-ghloe.json', 'bestiary-gos.json', 'bestiary-gotsf.json', 'bestiary-hat-tg.json',
        'bestiary-hftt.json', 'bestiary-hol.json', 'bestiary-hotdq.json', 'bestiary-idrotf.json',
        'bestiary-imr.json', 'bestiary-jttrc.json', 'bestiary-kftgv.json', 'bestiary-kkw.json',
        'bestiary-llk.json', 'bestiary-lmop.json', 'bestiary-lox.json', 'bestiary-lr.json',
        'bestiary-lrdt.json', 'bestiary-mabjov.json', 'bestiary-mcv1sc.json', 'bestiary-mcv2dc.json',
        'bestiary-mcv3mc.json', 'bestiary-mcv4ec.json', 'bestiary-mff.json', 'bestiary-mgelft.json',
        'bestiary-mismv1.json', 'bestiary-mm.json', 'bestiary-mot.json', 'bestiary-mpmm.json',
        'bestiary-mpp.json', 'bestiary-mtf.json', 'bestiary-nrh-ass.json', 'bestiary-nrh-at.json',
        'bestiary-nrh-avitw.json', 'bestiary-nrh-awol.json', 'bestiary-nrh-coi.json', 'bestiary-nrh-tcmc.json',
        'bestiary-nrh-tlt.json', 'bestiary-oota.json', 'bestiary-oow.json', 'bestiary-pabtso.json',
        'bestiary-phb.json', 'bestiary-pota.json', 'bestiary-ps-a.json', 'bestiary-ps-d.json',
        'bestiary-ps-i.json', 'bestiary-ps-k.json', 'bestiary-ps-x.json', 'bestiary-ps-z.json',
        'bestiary-qftis.json', 'bestiary-rmbre.json', 'bestiary-rot.json', 'bestiary-rtg.json',
        'bestiary-sads.json', 'bestiary-scc.json', 'bestiary-sdw.json', 'bestiary-skt.json',
        'bestiary-slw.json', 'bestiary-tce.json', 'bestiary-tdcsr.json', 'bestiary-tftyp.json',
        'bestiary-toa.json', 'bestiary-tob1-2023.json', 'bestiary-tofw.json', 'bestiary-ttp.json',
        'bestiary-vd.json', 'bestiary-veor.json', 'bestiary-vgm.json', 'bestiary-vrgr.json',
        'bestiary-wbtw.json', 'bestiary-wdh.json', 'bestiary-wdmm.json', 'bestiary-xdmg.json',
        'bestiary-xge.json', 'bestiary-xmm.json', 'bestiary-xphb.json'
      ];
      
             // Test which files actually exist by making HEAD requests in batches
       const existingFiles: string[] = [];
       const batchSize = 10; // Process files in smaller batches
       
       for (let i = 0; i < potentialFiles.length; i += batchSize) {
         const batch = potentialFiles.slice(i, i + batchSize);
         const batchPromises = batch.map(async (file) => {
           try {
             const response = await fetch(`${basePath}/${file}`, { method: 'HEAD' });
             return response.ok ? file : null;
           } catch (error) {
             return null;
           }
         });
         
         const batchResults = await Promise.all(batchPromises);
         const validFiles = batchResults.filter(file => file !== null) as string[];
         existingFiles.push(...validFiles);
         
         // Small delay between batches to avoid overwhelming the server
         if (i + batchSize < potentialFiles.length) {
           await new Promise(resolve => setTimeout(resolve, 100));
         }
       }
      
      console.log(`Discovered ${existingFiles.length} bestiary files`);
      setBestiaryFiles(existingFiles);
         } catch (error) {
       console.error('Error discovering bestiary files:', error);
       // Fallback to a comprehensive set of major files if discovery fails
       setBestiaryFiles([
         'bestiary-mm.json', 'bestiary-mpmm.json', 'bestiary-vgm.json', 'bestiary-mtf.json',
         'bestiary-ftd.json', 'bestiary-tob1-2023.json', 'bestiary-xmm.json', 'bestiary-cos.json',
         'bestiary-skt.json', 'bestiary-toa.json', 'bestiary-wdh.json', 'bestiary-wdmm.json',
         'bestiary-idrotf.json', 'bestiary-mot.json', 'bestiary-erlw.json', 'bestiary-ggr.json',
         'bestiary-egw.json', 'bestiary-tftyp.json', 'bestiary-oota.json', 'bestiary-bgg.json'
       ]);
     }
  };

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
      console.log('Starting type grouping...');
      const typeGroups: { [key: string]: Monster[] } = {};
      
      allMonsters.forEach((monster, index) => {
        try {
          // Handle different type formats and null checks
          let monsterType: string;
          
          if (!monster) {
            console.warn(`Monster at index ${index} is null/undefined`);
            return;
          }
          
          // Skip monsters without valid type data
          if (!monster.type) {
            console.warn(`Monster ${monster.name} has no type, skipping`);
            return; // Skip this monster
          }
          
          if (typeof monster.type === 'string') {
            monsterType = monster.type;
          } else if (typeof monster.type === 'object' && monster.type.type) {
            // Handle nested type objects
            if (typeof monster.type.type === 'string') {
              monsterType = monster.type.type;
            } else if (typeof monster.type.type === 'object' && (monster.type.type as any).choose && Array.isArray((monster.type.type as any).choose)) {
              // For choose arrays, create separate entries for each option
              const chooseOptions = (monster.type.type as any).choose;
              chooseOptions.forEach((chosenType: string) => {
                const capitalizedType = chosenType.charAt(0).toUpperCase() + chosenType.slice(1).toLowerCase();
                if (!typeGroups[capitalizedType]) {
                  typeGroups[capitalizedType] = [];
                }
                typeGroups[capitalizedType].push(monster);
              });
              return; // Skip the normal processing since we handled it above
            } else {
              console.warn(`Monster ${monster.name} has unhandled nested type structure, skipping`);
              return; // Skip this monster
            }
          } else {
            console.warn(`Monster ${monster.name} has unhandled type structure:`, monster.type, 'skipping');
            return; // Skip this monster
          }
          
          // Ensure monsterType is a string before calling charAt
          if (typeof monsterType !== 'string') {
            monsterType = 'Unknown';
          }
          
          // Capitalize first letter
          monsterType = monsterType.charAt(0).toUpperCase() + monsterType.slice(1).toLowerCase();
          
          if (!typeGroups[monsterType]) {
            typeGroups[monsterType] = [];
          }
          typeGroups[monsterType].push(monster);
        } catch (error) {
          console.warn(`Error processing monster at index ${index}:`, error);
        }
      });
      
      console.log(`Grouped into ${Object.keys(typeGroups).length} types`);
      
      // Convert to type data with descriptions and icons
      const types: MonsterTypeData[] = Object.entries(typeGroups).map(([type, monsters]) => ({
        type,
        count: monsters.length,
        description: getTypeDescription(type),
        icon: getTypeIcon(type)
      }));
      
      console.log('Created type data array:', types.length);
      
      // Sort by count (most common types first)
      types.sort((a, b) => b.count - a.count);
      
      console.log('Setting monster types and filtered types...');
      setMonsterTypes(types);
      setFilteredTypes(types);
      console.log('Type data set successfully');
    } catch (error) {
      console.error('Error loading bestiary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to clean complex objects
  const cleanTypeProperty = (type: any): string => {
    if (!type) return 'Unspecified';
    if (typeof type === 'string') return type;
    if (typeof type === 'object') {
      // Handle nested type objects with choose properties
      if (type.type) {
        if (typeof type.type === 'string') {
          return type.tags ? `${type.type} (${type.tags.join(', ')})` : type.type;
        } else if (typeof type.type === 'object' && type.type.choose && Array.isArray(type.type.choose)) {
          // Convert choose arrays to string
          return type.type.choose.join(' or ');
        }
      }
      // Handle direct choose objects
      if (type.choose && Array.isArray(type.choose)) {
        return type.choose.join(' or ');
      }
      return 'Unspecified';
    }
    return 'Unspecified';
  };

  const cleanArrayProperty = (arr: any): any => {
    if (!arr) return arr;
    if (Array.isArray(arr)) {
      return arr.map(item => {
        if (typeof item === 'string' || typeof item === 'number') return item;
        if (typeof item === 'object' && item !== null) {
          if (item.choose && Array.isArray(item.choose)) {
            return item.choose.join(' or ');
          }
                     return 'Unspecified';
         }
         return item;
      });
    }
    return arr;
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
          return false; // Skip monsters without type
        } else if (typeof monster.type === 'string') {
          monsterType = monster.type;
        } else if (typeof monster.type === 'object' && monster.type.type) {
          // Handle nested type objects
          if (typeof monster.type.type === 'string') {
            monsterType = monster.type.type;
          } else if (typeof monster.type.type === 'object' && (monster.type.type as any).choose && Array.isArray((monster.type.type as any).choose)) {
            // For choose arrays, check if any of the options match the selected type
            const chooseOptions = (monster.type.type as any).choose;
            const matchesAnyOption = chooseOptions.some((chosenType: string) => {
              const capitalizedType = chosenType.charAt(0).toUpperCase() + chosenType.slice(1).toLowerCase();
              return capitalizedType === selectedType;
            });
            if (matchesAnyOption) {
              monsterType = selectedType; // Use the selected type if it matches
            } else {
              return false; // This monster doesn't match the selected type
            }
          } else {
            return false; // Skip monsters with unhandled type structures
          }
        } else {
          return false; // Skip monsters with unhandled type structures
        }
        
        // Ensure monsterType is a string before calling charAt
        if (typeof monsterType !== 'string') {
          monsterType = 'Unknown';
        }
        
        // Capitalize first letter to match format
        monsterType = monsterType.charAt(0).toUpperCase() + monsterType.slice(1).toLowerCase();
        
        return monsterType === selectedType;
      }).map(monster => {
        // Clean monster data to prevent React errors with complex objects
        return {
          ...monster,
          type: cleanTypeProperty(monster.type),
          alignment: cleanArrayProperty(monster.alignment),
          size: cleanArrayProperty(monster.size)
        };
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
      'Undead': 'Creatures returned from death'
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
      'Undead': '💀'
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

  // Debug logging for render
  console.log('Rendering BestiaryTypeList:', {
    isLoading,
    allMonstersCount: allMonsters.length,
    monsterTypesCount: monsterTypes.length,
    filteredTypesCount: filteredTypes.length,
    bestiaryFilesCount: bestiaryFiles.length
  });

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
        {/* Debug info */}
        <p className="text-xs text-blue-500 mt-1">
          Debug: {monsterTypes.length} types, {filteredTypes.length} filtered
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