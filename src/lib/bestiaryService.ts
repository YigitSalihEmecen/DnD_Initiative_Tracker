import type { Monster } from '@/types';
import { trackFileDiscovery, trackFileDiscoveryEnd, trackTypeLoad, trackTypeLoadEnd } from './performanceMonitor';

interface MonsterTypeInfo {
  type: string;
  count: number;
  sources: string[]; // Which files contain this type
}

interface CachedMonsters {
  [type: string]: Monster[];
}

export class BestiaryService {
  private typeInfo: MonsterTypeInfo[] = [];
  private cachedMonsters: CachedMonsters = {};
  private availableFiles: string[] = [];
  private basePath: string;

  constructor() {
    this.basePath = process.env.NODE_ENV === 'production' ? '/DnD_Initiative_Tracker' : '';
  }

  // Step 1: Discover available bestiary files
  async discoverFiles(): Promise<string[]> {
    if (this.availableFiles.length > 0) {
      return this.availableFiles;
    }

    trackFileDiscovery();
    const potentialFiles = [
      'bestiary-mm.json', 'bestiary-mpmm.json', 'bestiary-vgm.json', 'bestiary-mtf.json',
      'bestiary-ftd.json', 'bestiary-xmm.json', 'bestiary-phb.json', 'bestiary-xphb.json',
      'bestiary-cos.json', 'bestiary-skt.json', 'bestiary-toa.json', 'bestiary-wdh.json',
      'bestiary-wdmm.json', 'bestiary-idrotf.json', 'bestiary-mot.json', 'bestiary-erlw.json',
      'bestiary-ggr.json', 'bestiary-egw.json', 'bestiary-vrgr.json', 'bestiary-tce.json',
      // Add more popular sourcebooks first for better user experience
      'bestiary-oota.json', 'bestiary-pota.json', 'bestiary-hotdq.json', 'bestiary-rot.json',
      'bestiary-lmop.json', 'bestiary-tftyp.json', 'bestiary-bgg.json', 'bestiary-xge.json'
    ];

    try {
      const existingFiles: string[] = [];
      const batchSize = 8; // Smaller batches for faster initial response
      
      for (let i = 0; i < potentialFiles.length; i += batchSize) {
        const batch = potentialFiles.slice(i, i + batchSize);
        const batchPromises = batch.map(async (file) => {
          try {
            const response = await fetch(`${this.basePath}/${file}`, { method: 'HEAD' });
            return response.ok ? file : null;
          } catch {
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validFiles = batchResults.filter(file => file !== null) as string[];
        existingFiles.push(...validFiles);
        
        // Small delay to avoid overwhelming the server
        if (i + batchSize < potentialFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      this.availableFiles = existingFiles;
      trackFileDiscoveryEnd();
      return existingFiles;
    } catch (error) {
      console.error('Error discovering bestiary files:', error);
      // Fallback to core files
      this.availableFiles = [
        'bestiary-mm.json', 'bestiary-mpmm.json', 'bestiary-vgm.json', 'bestiary-mtf.json'
      ];
      trackFileDiscoveryEnd();
      return this.availableFiles;
    }
  }

  // Step 2: Load type information only (lightweight)
  async loadTypeInfo(): Promise<MonsterTypeInfo[]> {
    if (this.typeInfo.length > 0) {
      return this.typeInfo;
    }

    await this.discoverFiles();
    const typeGroups: { [type: string]: { count: number; sources: string[] } } = {};

    // Load just enough from each file to count types
    const loadPromises = this.availableFiles.map(async (file) => {
      try {
        const response = await fetch(`${this.basePath}/${file}`);
        if (!response.ok) return;

        const data = await response.json();
        if (!data.monster || !Array.isArray(data.monster)) return;

        // Count types in this file
        data.monster.forEach((monster: Monster) => {
          const type = this.extractMonsterType(monster);
          if (type) {
            if (!typeGroups[type]) {
              typeGroups[type] = { count: 0, sources: [] };
            }
            typeGroups[type].count++;
            if (!typeGroups[type].sources.includes(file)) {
              typeGroups[type].sources.push(file);
            }
          }
        });
      } catch (error) {
        console.warn(`Failed to load type info from ${file}:`, error);
      }
    });

    await Promise.all(loadPromises);

    // Convert to array and sort by count
    this.typeInfo = Object.entries(typeGroups).map(([type, info]) => ({
      type,
      count: info.count,
      sources: info.sources
    })).sort((a, b) => b.count - a.count);

    return this.typeInfo;
  }

  // Step 3: Load monsters for a specific type (on-demand)
  async loadMonstersOfType(type: string): Promise<Monster[]> {
    // Check cache first
    if (this.cachedMonsters[type]) {
      console.log(`🚀 Cache hit for ${type} - instant load!`);
      return this.cachedMonsters[type];
    }

    trackTypeLoad(type);
    // Find which files contain this type
    const typeInfo = this.typeInfo.find(t => t.type === type);
    if (!typeInfo) {
      return [];
    }

    const monsters: Monster[] = [];

    // Load monsters from relevant files only
    const loadPromises = typeInfo.sources.map(async (file) => {
      try {
        const response = await fetch(`${this.basePath}/${file}`);
        if (!response.ok) return;

        const data = await response.json();
        if (!data.monster || !Array.isArray(data.monster)) return;

        // Filter monsters of the requested type
        data.monster.forEach((monster: Monster) => {
          const monsterType = this.extractMonsterType(monster);
          if (monsterType === type) {
            monsters.push(this.cleanMonster(monster));
          }
        });
      } catch (error) {
        console.warn(`Failed to load monsters from ${file}:`, error);
      }
    });

    await Promise.all(loadPromises);

    // Sort monsters by name
    monsters.sort((a, b) => a.name.localeCompare(b.name));

    // Cache the results
    this.cachedMonsters[type] = monsters;

    trackTypeLoadEnd(type);
    return monsters;
  }

  // Helper: Extract and normalize monster type
  private extractMonsterType(monster: Monster): string | null {
    if (!monster || !monster.type) return null;

    if (typeof monster.type === 'string') {
      return monster.type.charAt(0).toUpperCase() + monster.type.slice(1).toLowerCase();
    }

    if (typeof monster.type === 'object' && monster.type.type) {
      if (typeof monster.type.type === 'string') {
        return monster.type.type.charAt(0).toUpperCase() + monster.type.type.slice(1).toLowerCase();
      }
    }

    return null;
  }

  // Helper: Clean monster data for React rendering
  private cleanMonster(monster: Monster): Monster {
    return {
      ...monster,
      type: this.cleanTypeProperty(monster.type),
      alignment: this.cleanArrayProperty(monster.alignment),
      size: this.cleanArrayProperty(monster.size)
    };
  }

  private cleanTypeProperty(type: any): string {
    if (!type) return 'Unspecified';
    if (typeof type === 'string') return type;
    if (typeof type === 'object') {
      if (type.type) {
        if (typeof type.type === 'string') {
          return type.tags ? `${type.type} (${type.tags.join(', ')})` : type.type;
        }
      }
      return 'Unspecified';
    }
    return 'Unspecified';
  }

  private cleanArrayProperty(arr: any): any {
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
  }

  // Get type descriptions and icons
  getTypeDescription(type: string): string {
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
  }

  getTypeIcon(type: string): string {
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
  }

  // Clear cache if needed
  clearCache(): void {
    this.cachedMonsters = {};
  }

  // Get cache status for debugging
  getCacheStatus(): { cachedTypes: string[]; totalCached: number } {
    return {
      cachedTypes: Object.keys(this.cachedMonsters),
      totalCached: Object.values(this.cachedMonsters).reduce((sum, monsters) => sum + monsters.length, 0)
    };
  }
}

// Singleton instance
export const bestiaryService = new BestiaryService(); 