import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { buildings, rooms, features, roomFeatures } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';
import * as schema from '@/lib/db/schema';

config({ path: '.env.local' });

const db = drizzle(process.env.DATABASE_URL!, { schema });

const VALID_ROOM_TYPES = ["classroom", "computer-lab", "science-lab", "lecture-hall", "office", "performance-hall", "chapel", "gym", "breakroom", "conference-room", "lobby", "study-room", "special"] as const;

// Type for our CSV row
interface RoomDataRow {
    building_name: string;
    building_abbrev: string;
    room_number: string;
    room_display_name?: string;
    room_type: string;
    floor: string;
    projector_qty?: string;
    tv_qty?: string;
    whiteboard?: string;
    chalkboard?: string;
    smartboard?: string;
    speaker?: string;
    microphone?: string;
    camera?: string;
    hdmi?: string;
    usb_c?: string;
    vga?: string;
    table_qty?: string;
    table_details?: string;
    chair_qty?: string;
    chair_type?: string;
    presentation_stand?: string;
    workstation?: string;
    windows?: string;
    wash_station?: string;
    notes?: string;
    photo_back?: string;
    photo_front?: string;
  }

// Feature mapping (CSV column -> feature name + category)
const FEATURE_MAP: Record<string, { name: string; category: string }> = {
  projector_qty: { name: 'Projector', category: 'display' },
  tv_qty: { name: 'TV/Monitor', category: 'display' },
  whiteboard: { name: 'Whiteboard', category: 'display' },
  chalkboard: { name: 'Chalkboard', category: 'display' },
  smartboard: { name: 'Smartboard', category: 'display' },
  speaker: { name: 'Speakers', category: 'audio' },
  microphone: { name: 'Microphone', category: 'audio' },
  camera: { name: 'Camera', category: 'audio' },
  hdmi: { name: 'HDMI', category: 'connectivity' },
  vga: { name: 'VGA', category: 'connectivity' },
  usb_c: { name: 'USB-C', category: 'connectivity' },
  presentation_stand: { name: 'Presentation Stand', category: 'furniture' },
  workstation: { name: 'Workstation', category: 'furniture' },
  windows: { name: 'Windows', category: 'characteristics' },
  wash_station: { name: 'Wash Station', category: 'characteristics' },
};

async function seedDatabase() {
  console.log('Starting database seed...\n');

  try {
    // Read and parse CSV
    const csvContent = readFileSync('./seed-data.csv', 'utf-8');
    const records: RoomDataRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} rooms in CSV\n`);

    // Step 1: Create unique buildings
    const uniqueBuildings = new Map<string, { name: string; abbrev: string }>();
    records.forEach((row) => {
      if (!uniqueBuildings.has(row.building_abbrev)) {
        uniqueBuildings.set(row.building_abbrev, {
          name: row.building_name,
          abbrev: row.building_abbrev,
        });
      }
    });

    console.log(`Creating ${uniqueBuildings.size} buildings...`);
    console.log(uniqueBuildings);
    const buildingIdMap = new Map<string, string>();

    for (const [abbrev, data] of uniqueBuildings) {
      const buildingId = nanoid();
      await db.insert(buildings).values({
        id: buildingId,
        name: data.name,
        abbreviation: abbrev,
      });
      buildingIdMap.set(abbrev, buildingId);
      console.log(`  ✓ ${data.name} (${abbrev})`);
    }

    // Step 2: Create all unique features
    console.log('\nCreating features...');
    const allFeatures = new Set<string>();
    
    // Collect all features that exist in the data
    records.forEach((row) => {
      Object.keys(FEATURE_MAP).forEach((key) => {
        const value = row[key as keyof RoomDataRow];
        if (value && value !== '0' && value !== 'no') {
          allFeatures.add(key);
        }
      });
      
      // Special handling for tables and chairs (always has details)
      if (row.table_qty) allFeatures.add('tables');
      if (row.chair_qty) allFeatures.add('chairs');
    });

    const featureIdMap = new Map<string, string>();

    for (const featureKey of allFeatures) {
      const featureData = FEATURE_MAP[featureKey];
      if (!featureData) continue; // Skip if not in map (like tables/chairs which we handle separately)

      const featureId = nanoid();
      await db.insert(features).values({
        id: featureId,
        name: featureData.name,
        category: featureData.category,
      });
      featureIdMap.set(featureKey, featureId);
      console.log(`  ✓ ${featureData.name} (${featureData.category})`);
    }

    // Add tables and chairs features
    const tablesId = nanoid();
    await db.insert(features).values({
      id: tablesId,
      name: 'Tables',
      category: 'furniture',
    });
    featureIdMap.set('tables', tablesId);
    console.log(`  ✓ Tables (furniture)`);

    const chairsId = nanoid();
    await db.insert(features).values({
      id: chairsId,
      name: 'Chairs',
      category: 'furniture',
    });
    featureIdMap.set('chairs', chairsId);
    console.log(`  ✓ Chairs (furniture)`);

    // Step 3: Create rooms and their features
    console.log('\nCreating rooms...');
    let roomCount = 0;

    for (const row of records) {
      const buildingId = buildingIdMap.get(row.building_abbrev);
      if (!buildingId) {
        console.error(`  ✗ Building not found: ${row.building_abbrev}`);
        continue;
      }

      // Validate room type
      if (!VALID_ROOM_TYPES.includes(row.room_type as (typeof VALID_ROOM_TYPES)[number])) {
        console.error(`  ✗ Invalid room type "${row.room_type}" for ${row.building_abbrev} ${row.room_number}. Valid types: ${VALID_ROOM_TYPES.join(', ')}`);
        continue;
      }

      // Create room
      const roomId = nanoid();
      await db.insert(rooms).values({
        id: roomId,
        buildingId,
        roomNumber: row.room_number,
        roomType: row.room_type as (typeof VALID_ROOM_TYPES)[number],
        displayName: row.room_display_name || null,
        capacity: parseInt(row.chair_qty || '0') || 0,
        floor: parseInt(row.floor),
        photoBack: row.photo_back || null,
        photoFront: row.photo_front || null,
        notes: row.notes || null,
      });

      console.log(`  ✓ ${row.building_abbrev} ${row.room_number}`);
      roomCount++;

      // Add room features
      const roomFeaturesToInsert: Array<{
        roomId: string;
        featureId: string;
        quantity: number;
        details: string | null;
      }> = [];

      // Process standard features
      for (const [csvKey, featureKey] of Object.entries(FEATURE_MAP)) {
        const value = row[csvKey as keyof RoomDataRow];
        if (!value || value === '0' || value === 'no') continue;

        const featureId = featureIdMap.get(csvKey);
        if (!featureId) continue;

        // Check if it's a quantity field or yes/no field
        const isQuantityField = csvKey.endsWith('_qty');
        const quantity = isQuantityField ? parseInt(value) : 1;

        roomFeaturesToInsert.push({
          roomId,
          featureId,
          quantity,
          details: null,
        });
      }

      // Handle tables (with details)
      if (row.table_qty) {
        const tablesFeatureId = featureIdMap.get('tables');
        if (tablesFeatureId) {
          const tableDetails = [row.table_qty, row.table_details].filter(Boolean).join(', ');
          roomFeaturesToInsert.push({
            roomId,
            featureId: tablesFeatureId,
            quantity: parseInt(row.table_qty) || 1,
            details: tableDetails,
          });
        }
      }

      // Handle chairs (with type)
      if (row.chair_qty) {
        const chairsFeatureId = featureIdMap.get('chairs');
        if (chairsFeatureId) {
          roomFeaturesToInsert.push({
            roomId,
            featureId: chairsFeatureId,
            quantity: parseInt(row.chair_qty) || 1,
            details: row.chair_type || null,
          });
        }
      }

      // Insert all room features
      if (roomFeaturesToInsert.length > 0) {
        await db.insert(roomFeatures).values(roomFeaturesToInsert);
      }
    }

    console.log(`\n✅ Successfully seeded ${roomCount} rooms!`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase();