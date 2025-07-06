'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { bestiaryService } from '@/lib/bestiaryService';
import { trackBestiaryLoad, trackBestiaryLoadEnd } from '@/lib/performanceMonitor';
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
  const [monsterTypes, setMonsterTypes] = useState<MonsterTypeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<MonsterTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingType, setLoadingType] = useState<string | null>(null);

  useEffect(() => {
    loadTypeInfo();
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

  const loadTypeInfo = async () => {
    try {
      setIsLoading(true);
      trackBestiaryLoad();
      
      // Load type information (fast!)
      const typeInfo = await bestiaryService.loadTypeInfo();
      
      // Convert to display format
      const types: MonsterTypeData[] = typeInfo.map(info => ({
        type: info.type,
        count: info.count,
        description: bestiaryService.getTypeDescription(info.type),
        icon: bestiaryService.getTypeIcon(info.type)
      }));

      setMonsterTypes(types);
      setFilteredTypes(types);
      trackBestiaryLoadEnd();
    } catch (error) {
      console.error('Error loading bestiary types:', error);
      trackBestiaryLoadEnd();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectType = async (selectedType: string) => {
    try {
      setLoadingType(selectedType);
      
      // Load monsters for this type on-demand
      const monsters = await bestiaryService.loadMonstersOfType(selectedType);
      
      onSelectType(selectedType, monsters);
    } catch (error) {
      console.error('Error loading monsters for type:', selectedType, error);
    } finally {
      setLoadingType(null);
    }
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
          <div className="inline-flex items-center gap-3 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg">Loading bestiary types...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Discovering available monsters and organizing by type
          </p>
        </div>
      </div>
    );
  }

  const totalMonsters = monsterTypes.reduce((sum, type) => sum + type.count, 0);

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
          {totalMonsters.toLocaleString()} monsters available across {monsterTypes.length} types
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
        {filteredTypes.map((typeData) => {
          const isLoadingThis = loadingType === typeData.type;
          
          return (
            <Card 
              key={typeData.type}
              className={`cursor-pointer transition-all duration-200 ${
                isLoadingThis 
                  ? 'opacity-75 cursor-not-allowed' 
                  : 'hover:shadow-lg hover:scale-105'
              }`}
              onClick={() => !isLoadingThis && handleSelectType(typeData.type)}
            >
              <CardHeader className="text-center pb-4">
                <div className="text-4xl mb-2 relative">
                  {typeData.icon}
                  {isLoadingThis && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl">{typeData.type}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">{typeData.description}</p>
                <Badge 
                  variant="secondary" 
                  className={`text-lg px-4 py-2 ${
                    isLoadingThis ? 'opacity-75' : ''
                  }`}
                >
                  {isLoadingThis ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    `${typeData.count.toLocaleString()} creatures`
                  )}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No creature types found matching your search.</p>
        </div>
      )}

      {/* Cache status for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 text-center text-xs text-muted-foreground">
          Cache: {JSON.stringify(bestiaryService.getCacheStatus())}
        </div>
      )}
    </div>
  );
} 