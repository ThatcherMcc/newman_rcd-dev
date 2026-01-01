'use server';

import { db } from '@/lib/db';
import { buildings, rooms, features, roomFeatures } from '@/lib/db/schema';
import { eq, sql, and, gte, lte, inArray } from 'drizzle-orm';
import type { SearchFilters, RoomWithDetails, Building, Feature, RoomType } from '@/types/types';

export async function searchRooms(filters: SearchFilters): Promise<RoomWithDetails[]> {
  const conditions = [];

  if (filters.buildingId) {
    conditions.push(eq(rooms.buildingId, filters.buildingId));
  }

  if (filters.roomType) {
    conditions.push(eq(rooms.roomType, filters.roomType as RoomType));
  }

  if (filters.minCapacity !== undefined) {
    conditions.push(gte(rooms.capacity, filters.minCapacity));
  }

  if (filters.maxCapacity !== undefined) {
    conditions.push(lte(rooms.capacity, filters.maxCapacity));
  }

  if (filters.floor !== undefined) {
    conditions.push(eq(rooms.floor, filters.floor));
  }

  if (filters.accessible !== undefined) {
    conditions.push(eq(rooms.accessible, filters.accessible));
  }

  if (filters.searchQuery) {
    conditions.push(
      sql`(${rooms.roomNumber} ILIKE ${`%${filters.searchQuery}%`} OR ${rooms.displayName} ILIKE ${`%${filters.searchQuery}%`})`
    );
  }

  // Base query for rooms
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const roomsResult = await db
    .select({
      id: rooms.id,
      buildingId: rooms.buildingId,
      roomNumber: rooms.roomNumber,
      roomType: rooms.roomType,
      displayName: rooms.displayName,
      capacity: rooms.capacity,
      floor: rooms.floor,
      accessible: rooms.accessible,
      notes: rooms.notes,
      photoFront: rooms.photoFront,
      photoBack: rooms.photoBack,
      buildingName: buildings.name,
      buildingAbbrev: buildings.abbreviation,
    })
    .from(rooms)
    .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(whereClause)
    .orderBy(buildings.abbreviation, rooms.roomNumber);

  // If filtering by features, we need to check which rooms have ALL required features
  let filteredRooms = roomsResult;
  if (filters.featureIds && filters.featureIds.length > 0) {
    const roomIds = roomsResult.map((r) => r.id);

    if (roomIds.length > 0) {
      // Get all room features for these rooms
      const roomFeaturesData = await db
        .select({
          roomId: roomFeatures.roomId,
          featureId: roomFeatures.featureId,
        })
        .from(roomFeatures)
        .where(inArray(roomFeatures.roomId, roomIds));

      // Filter to rooms that have ALL required features
      const roomsWithAllFeatures = new Set(
        roomIds.filter((roomId) => {
          const roomFeatureIds = roomFeaturesData
            .filter((rf) => rf.roomId === roomId)
            .map((rf) => rf.featureId);

          return filters.featureIds!.every((fid) => roomFeatureIds.includes(fid));
        })
      );

      filteredRooms = roomsResult.filter((r) => roomsWithAllFeatures.has(r.id));
    }
  }

  // Fetch features for each room
  const roomIds = filteredRooms.map((r) => r.id);
  let roomFeaturesData: Array<{
    roomId: string;
    featureId: string;
    quantity: number;
    details: string | null;
    featureName: string;
    featureCategory: string;
  }> = [];

  if (roomIds.length > 0) {
    roomFeaturesData = await db
      .select({
        roomId: roomFeatures.roomId,
        featureId: roomFeatures.featureId,
        quantity: roomFeatures.quantity,
        details: roomFeatures.details,
        featureName: features.name,
        featureCategory: features.category,
      })
      .from(roomFeatures)
      .innerJoin(features, eq(roomFeatures.featureId, features.id))
      .where(inArray(roomFeatures.roomId, roomIds));
  }

  // Combine rooms with their features
  return filteredRooms.map((room) => ({
    ...room,
    features: roomFeaturesData
      .filter((rf) => rf.roomId === room.id)
      .map((rf) => ({
        id: rf.featureId,
        name: rf.featureName,
        category: rf.featureCategory,
        quantity: rf.quantity,
        details: rf.details,
      })),
  }));
}

export async function getBuildings(): Promise<Building[]> {
  return await db
    .select({
      id: buildings.id,
      name: buildings.name,
      abbreviation: buildings.abbreviation,
    })
    .from(buildings)
    .orderBy(buildings.abbreviation);
}

export async function getFeatures(): Promise<Feature[]> {
  return await db
    .select({
      id: features.id,
      name: features.name,
      category: features.category,
    })
    .from(features)
    .orderBy(features.category, features.name);
}

export async function getRoomById(id: string): Promise<RoomWithDetails | null> {
  const roomResult = await db
    .select({
      id: rooms.id,
      buildingId: rooms.buildingId,
      roomNumber: rooms.roomNumber,
      roomType: rooms.roomType,
      displayName: rooms.displayName,
      capacity: rooms.capacity,
      floor: rooms.floor,
      accessible: rooms.accessible,
      notes: rooms.notes,
      photoFront: rooms.photoFront,
      photoBack: rooms.photoBack,
      buildingName: buildings.name,
      buildingAbbrev: buildings.abbreviation,
    })
    .from(rooms)
    .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(eq(rooms.id, id))
    .limit(1);

  if (roomResult.length === 0) return null;

  const room = roomResult[0];

  const roomFeaturesData = await db
    .select({
      featureId: roomFeatures.featureId,
      quantity: roomFeatures.quantity,
      details: roomFeatures.details,
      featureName: features.name,
      featureCategory: features.category,
    })
    .from(roomFeatures)
    .innerJoin(features, eq(roomFeatures.featureId, features.id))
    .where(eq(roomFeatures.roomId, id));

  return {
    ...room,
    features: roomFeaturesData.map((rf) => ({
      id: rf.featureId,
      name: rf.featureName,
      category: rf.featureCategory,
      quantity: rf.quantity,
      details: rf.details,
    })),
  };
}