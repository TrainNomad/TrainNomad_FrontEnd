import { useState } from 'react';
import type { Journey } from '../types/api';
import AnimatedFilterButton from './AnimatedFilterButton';

interface JourneyFiltersProps {
  journeys: Journey[];
  onFilterChange: (filters: {
    directOnly: boolean;
    trainTypes: string[];
    maxTransfers: number | null;
  }) => void;
}

export default function JourneyFilters({ journeys, onFilterChange }: JourneyFiltersProps) {
  // Calculer les options de filtre à partir des données
  const hasDirect = journeys.some((j) => j.transfers === 0);
  const trainTypes = Array.from(new Set(journeys.flatMap((j) => j.train_types)));
  const maxTransfersInResults = Math.max(...journeys.map((j) => j.transfers), 0);

  // État local des filtres
  const [filters, setFilters] = useState({
    directOnly: false,
    trainTypes: [] as string[],
    maxTransfers: null as number | null,
  });

  // Mettre à jour les filtres parents
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    handleFilterChange({
      directOnly: false,
      trainTypes: [],
      maxTransfers: null,
    });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filters.directOnly || filters.trainTypes.length > 0 || filters.maxTransfers !== null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm mb-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtre : Trajets directs (uniquement si des trajets directs existent) */}
        {hasDirect && (
          <AnimatedFilterButton
            isActive={filters.directOnly}
            onClick={() => {
              handleFilterChange({
                ...filters,
                directOnly: !filters.directOnly,
                // Si on filtre uniquement les directs, on désactive les autres filtres incompatibles
                maxTransfers: !filters.directOnly ? 0 : filters.maxTransfers,
              });
            }}
          >
            Directs uniquement
          </AnimatedFilterButton>
        )}

        {/* Filtre : Type de train (uniquement s'il y a plusieurs types) */}
        {trainTypes.length > 1 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs font-medium text-slate-500 mr-1">Type :</span>
            {trainTypes.map((type) => {
              const isActive = filters.trainTypes.includes(type);
              return (
                <AnimatedFilterButton
                  key={type}
                  isActive={isActive}
                  onClick={() => {
                    const newTypes = isActive
                      ? filters.trainTypes.filter((t) => t !== type)
                      : [...filters.trainTypes, type];
                    handleFilterChange({ ...filters, trainTypes: newTypes });
                  }}
                >
                  {type}
                </AnimatedFilterButton>
              );
            })}
          </div>
        )}

        {/* Filtre : Nombre de correspondances */}
        {maxTransfersInResults > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs font-medium text-slate-500 mr-1">Max :</span>
            {[0, 1, 2, 3].map((num) => {
              if (num > maxTransfersInResults) return null;
              const isActive = filters.maxTransfers === num;
              return (
                <AnimatedFilterButton
                  key={num}
                  isActive={isActive}
                  onClick={() => {
                    handleFilterChange({
                      ...filters,
                      maxTransfers: isActive ? null : num,
                      // Si on limite à 0, c'est équivalent à "directs uniquement"
                      directOnly: num === 0,
                    });
                  }}
                >
                  {num}
                </AnimatedFilterButton>
              );
            })}
          </div>
        )}

        {/* Bouton de réinitialisation */}
        {hasActiveFilters && (
          <AnimatedFilterButton
            isActive={true}
            onClick={resetFilters}
          >
            Réinitialiser
          </AnimatedFilterButton>
        )}
      </div>
    </div>
  );
}
