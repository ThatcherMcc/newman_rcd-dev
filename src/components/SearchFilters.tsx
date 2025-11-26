'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { SearchFilters as FilterType, Building, Feature } from '@/types/types';
import { ROOM_TYPES } from '@/types/types';

interface SearchFiltersProps {
  buildings: Building[];
  features: Feature[];
  currentFilters: FilterType;
}

export function SearchFilters({ buildings, features, currentFilters }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(currentFilters.searchQuery || '');
  const [selectedBuilding, setSelectedBuilding] = useState(currentFilters.buildingId || '');
  const [selectedType, setSelectedType] = useState(currentFilters.roomType || '');
  const [minCapacity, setMinCapacity] = useState(currentFilters.minCapacity?.toString() || '');
  const [maxCapacity, setMaxCapacity] = useState(currentFilters.maxCapacity?.toString() || '');
  const [floor, setFloor] = useState(currentFilters.floor?.toString() || '');
  const [accessibleOnly, setAccessibleOnly] = useState(currentFilters.accessible || false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(currentFilters.featureIds || []);

  const updateFilters = () => {
    const params = new URLSearchParams();

    if (searchQuery) params.set('q', searchQuery);
    if (selectedBuilding) params.set('building', selectedBuilding);
    if (selectedType) params.set('type', selectedType);
    if (minCapacity) params.set('minCapacity', minCapacity);
    if (maxCapacity) params.set('maxCapacity', maxCapacity);
    if (floor) params.set('floor', floor);
    if (accessibleOnly) params.set('accessible', 'true');
    selectedFeatures.forEach((featureId) => params.append('features', featureId));

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBuilding('');
    setSelectedType('');
    setMinCapacity('');
    setMaxCapacity('');
    setFloor('');
    setAccessibleOnly(false);
    setSelectedFeatures([]);
    startTransition(() => {
      router.push('/');
    });
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
  };

  // Group features by category
  const featuresByCategory = features.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, Feature[]>
  );

  const hasActiveFilters =
    searchQuery ||
    selectedBuilding ||
    selectedType ||
    minCapacity ||
    maxCapacity ||
    floor ||
    accessibleOnly ||
    selectedFeatures.length > 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={isPending}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
            placeholder="Room number or name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Building */}
        <div>
          <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-2">
            Building
          </label>
          <select
            id="building"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All buildings</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.abbreviation} - {building.name}
              </option>
            ))}
          </select>
        </div>

        {/* Room Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Room Type
          </label>
          <select
            id="type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              placeholder="Min"
              min="0"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="Max"
              min="0"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Floor */}
        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2">
            Floor
          </label>
          <input
            id="floor"
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="Any floor"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Accessible */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => setAccessibleOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Accessible only</span>
          </label>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
          <div className="space-y-4">
            {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryFeatures.map((feature) => (
                    <label
                      key={feature.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feature.id)}
                        onChange={() => toggleFeature(feature.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{feature.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Filters Button */}
        <button
          onClick={updateFilters}
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
}
