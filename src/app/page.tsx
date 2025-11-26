import { SearchFilters } from '../components/SearchFilters';
import { RoomList } from '../components/RoomList';
import { searchRooms, getBuildings, getFeatures } from '@/actions/rooms';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  // Parse search parameters into filters
  const filters = {
    buildingId: typeof params.building === 'string' ? params.building : undefined,
    roomType: typeof params.type === 'string' ? params.type : undefined,
    minCapacity: params.minCapacity ? parseInt(params.minCapacity as string) : undefined,
    maxCapacity: params.maxCapacity ? parseInt(params.maxCapacity as string) : undefined,
    floor: params.floor ? parseInt(params.floor as string) : undefined,
    accessible: params.accessible === 'true' ? true : undefined,
    featureIds: Array.isArray(params.features)
      ? params.features
      : params.features
        ? [params.features]
        : undefined,
    searchQuery: typeof params.q === 'string' ? params.q : undefined,
  };

  // Fetch data in parallel
  const [rooms, buildings, features] = await Promise.all([
    searchRooms(filters),
    getBuildings(),
    getFeatures(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Room Directory</h1>
          <p className="text-gray-600">Search and filter rooms across campus</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <SearchFilters
              buildings={buildings}
              features={features}
              currentFilters={filters}
            />
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            <RoomList rooms={rooms} />
          </main>
        </div>
      </div>
    </div>
  );
}
