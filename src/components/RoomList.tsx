import Link from 'next/link';
import type { RoomWithDetails } from '@/types/types';

interface RoomListProps {
  rooms: RoomWithDetails[];
}

export function RoomList({ rooms }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
        <p className="text-gray-600">Try adjusting your filters to see more results</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <p className="text-sm text-gray-600">
          Found <span className="font-semibold text-gray-900">{rooms.length}</span> room
          {rooms.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: RoomWithDetails }) {
  const roomTypeDisplay = room.roomType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Group features by category
  const featuresByCategory = room.features.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, typeof room.features>
  );

  return (
    <Link href={`/rooms/${room.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200 hover:border-blue-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {room.buildingAbbrev} {room.roomNumber}
              {room.displayName && (
                <span className="text-gray-600 font-normal ml-2">({room.displayName})</span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{room.buildingName}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!room.accessible && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                title="Not wheelchair accessible"
              >
                Limited Access
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Type</p>
            <p className="text-sm font-medium text-gray-900">{roomTypeDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Capacity</p>
            <p className="text-sm font-medium text-gray-900">{room.capacity} people</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Floor</p>
            <p className="text-sm font-medium text-gray-900">
              {room.floor === 0 ? 'Ground' : room.floor > 0 ? `${room.floor}` : `B${Math.abs(room.floor)}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Features</p>
            <p className="text-sm font-medium text-gray-900">{room.features.length}</p>
          </div>
        </div>

        {room.features.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(featuresByCategory).map(([category, features]) => (
                <div key={category} className="flex flex-wrap gap-2">
                  {features.slice(0, 5).map((feature) => (
                    <span
                      key={feature.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      title={feature.details || undefined}
                    >
                      {feature.name}
                      {feature.quantity > 1 && ` (${feature.quantity})`}
                    </span>
                  ))}
                </div>
              ))}
              {room.features.length > 5 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{room.features.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {room.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 line-clamp-2">{room.notes}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
