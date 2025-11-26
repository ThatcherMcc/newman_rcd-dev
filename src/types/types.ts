export interface SearchFilters {
  buildingId?: string;
  roomType?: string;
  minCapacity?: number;
  maxCapacity?: number;
  floor?: number;
  accessible?: boolean;
  featureIds?: string[];
  searchQuery?: string;
}

export interface RoomWithDetails {
  id: string;
  buildingId: string;
  buildingName: string;
  buildingAbbrev: string;
  roomNumber: string;
  roomType: string;
  displayName: string | null;
  capacity: number;
  floor: number;
  accessible: boolean;
  notes: string | null;
  photoFront: string | null;
  photoBack: string | null;
  features: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    details: string | null;
  }>;
}

export interface Building {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Feature {
  id: string;
  name: string;
  category: string;
}

export const ROOM_TYPES = [
  'classroom',
  'computer-lab',
  'science-lab',
  'lecture-hall',
  'office',
  'performance-hall',
  'chapel',
  'gym',
  'breakroom',
  'conference-room',
  'lobby',
  'study-room',
  'special',
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];
