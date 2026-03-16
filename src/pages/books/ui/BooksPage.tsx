import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BOOKING_ZONES } from '@/pages/books/model/zoneData';

import BookingZoneList from './components/BookingZoneList';
import BookingZoneMap from './components/BookingZoneMap';

const ZONE_DISPLAY_ORDER = ['k9', 'k8', 'k5', 'ev', 'outfield', 'skybox', 'champion', 'center-table', 'mediheal-table', 'party', 'family'];

const BooksPage = () => {
   const navigate = useNavigate();
   const zones = useMemo(
      () =>
         [...BOOKING_ZONES].sort(
            (a, b) => ZONE_DISPLAY_ORDER.indexOf(a.id) - ZONE_DISPLAY_ORDER.indexOf(b.id) || b.remaining - a.remaining,
         ),
      [],
   );

   const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? '');

   const handleSelectZone = (zoneId: string) => {
      setSelectedZoneId(zoneId);
      navigate(`/books/seats/${zoneId}`);
   };

   return (
      <div className="w-full bg-background text-foreground">
         <main className="flex min-h-[calc(100vh-140px)] flex-col lg:grid lg:h-[calc(100vh-140px)] lg:grid-cols-[minmax(0,1fr)_420px]">
            <BookingZoneMap zones={zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
            <BookingZoneList zones={zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
         </main>
      </div>
   );
};

export default BooksPage;
