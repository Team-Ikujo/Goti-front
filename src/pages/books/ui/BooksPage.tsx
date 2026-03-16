import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BOOKING_ZONES } from '@/pages/books/model/zoneData';

import BookingZoneList from './components/BookingZoneList';
import BookingZoneMap from './components/BookingZoneMap';

const BooksPage = () => {
   const navigate = useNavigate();
   const zones = useMemo(
      () => [...BOOKING_ZONES].sort((a, b) => b.price - a.price || b.remaining - a.remaining),
      [],
   );

   const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? '');

   const handleSelectZone = (zoneId: string) => {
      setSelectedZoneId(zoneId);
      navigate(`/books/seats/${zoneId}`);
   };

   return (
      <div className="w-full bg-background text-foreground">
         <main className="flex min-h-[calc(100vh-140px)] flex-col lg:h-[calc(100vh-140px)] lg:flex-row">
            <BookingZoneMap zones={zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
            <BookingZoneList zones={zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
         </main>
      </div>
   );
};

export default BooksPage;
