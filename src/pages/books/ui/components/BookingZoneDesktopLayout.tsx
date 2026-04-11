import type { ZoneItem } from '@/pages/books/model/types';

import BookingZoneList from './BookingZoneList';
import BookingZoneMap from './BookingZoneMap';

type BookingZoneDesktopLayoutProps = {
   zones: ZoneItem[];
   selectedZoneId: string;
   onSelectZone: (zoneId: string) => void;
   stadiumImage: string;
   stadiumImageAlt: string;
   showPrice?: boolean;
};

function BookingZoneDesktopLayout({
   zones,
   selectedZoneId,
   onSelectZone,
   stadiumImage,
   stadiumImageAlt,
   showPrice = true,
}: BookingZoneDesktopLayoutProps) {
   return (
      <main className="hidden min-h-[calc(100vh-140px)] lg:grid lg:h-[calc(100vh-140px)] lg:grid-cols-[minmax(0,1fr)_420px]">
         <BookingZoneMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            stadiumImage={stadiumImage}
            stadiumImageAlt={stadiumImageAlt}
         />
         <BookingZoneList
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            showPrice={showPrice}
         />
      </main>
   );
}

export default BookingZoneDesktopLayout;
