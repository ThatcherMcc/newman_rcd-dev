import { getRoomById } from '@/actions/rooms';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params;
  const room = await getRoomById(id);

  if (!room) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Navigation */}
        <Link href="/" className="text-gray-500 hover:text-blue-600 transition-colors mb-6 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Directory
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* PHOTO SECTION (Now at the top) */}
          {(room.photoFront || room.photoBack) && (
            <div className={`grid gap-1 bg-gray-200 ${room.photoFront && room.photoBack ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {room.photoFront && (
                <div className="relative h-64 md:h-96 w-full">
                  <img 
                    src={room.photoFront} 
                    alt="Front view" 
                    className="w-full h-full object-cover hover:opacity-95 transition-opacity" 
                  />
                  <span className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md text-xs backdrop-blur-sm">Front View</span>
                </div>
              )}
              {room.photoBack && (
                <div className="relative h-64 md:h-96 w-full">
                  <img 
                    src={room.photoBack} 
                    alt="Back view" 
                    className="w-full h-full object-cover hover:opacity-95 transition-opacity" 
                  />
                  <span className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md text-xs backdrop-blur-sm">Rear View</span>
                </div>
              )}
            </div>
          )}

          {/* Header Section */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                  {room.roomType.replace('-', ' ')}
                </span>
                
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {room.buildingAbbrev} {room.roomNumber}
                </h1>

                <p className="mt-2 text-gray-600 flex items-center gap-2">
                  <span className="font-medium text-gray-900">{room.buildingName}</span> 
                  <span className="text-gray-900">|</span> 
                  <span>Floor {room.floor === 0 ? 'G' : room.floor}</span>
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="text-center px-6 py-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-bold">Capacity</p>
                  <p className="text-2xl font-black text-blue-600">{room.capacity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left/Middle: Notes & Features */}
            <div className="lg:col-span-2 space-y-10">
              {room.notes && (
                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">About this Room</h3>
                  <div className="prose prose-blue text-gray-600 max-w-none">
                    {room.notes}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Equipment & Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {room.features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-gray-700">{feature.name}</span>
                      </div>
                      {feature.quantity > 1 && (
                        <span className="text-sm font-semibold text-gray-400">×{feature.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Side: Quick Info Sidebar */}
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border-2 ${room.accessible ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'}`}>
                <h4 className={`font-bold mb-2 ${room.accessible ? 'text-green-800' : 'text-amber-800'}`}>
                  {room.accessible ? 'ADA Accessible' : 'Limited Accessibility'}
                </h4>
                <p className={`text-sm ${room.accessible ? 'text-green-700' : 'text-amber-700'}`}>
                  {room.accessible 
                    ? 'This room is fully equipped for wheelchair access and mobility requirements.' 
                    : 'This room may have stairs or narrow entryways. Contact facility management for details.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}