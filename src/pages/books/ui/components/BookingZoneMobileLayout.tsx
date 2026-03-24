import type { BookingFlowMode } from '@/shared/lib/booking-flow';
import { Drawer, DrawerContent, DrawerTrigger } from '@/shared/ui/drawer';
import type { ZoneItem } from '@/pages/books/model/types';

import BookingZoneList from './BookingZoneList';
import BookingZoneMap from './BookingZoneMap';

type BookingZoneMobileLayoutProps = {
   bookingFlowMode: BookingFlowMode;
   zones: ZoneItem[];
   selectedZoneId: string;
   isCaptchaOpen: boolean;
   isZoneDrawerOpen: boolean;
   onOpenChange: (open: boolean) => void;
   onSelectZone: (zoneId: string) => void;
   stadiumImage: string;
   stadiumImageAlt: string;
};

function BookingZoneMobileLayout({
   bookingFlowMode,
   zones,
   selectedZoneId,
   isCaptchaOpen,
   isZoneDrawerOpen,
   onOpenChange,
   onSelectZone,
   stadiumImage,
   stadiumImageAlt,
}: BookingZoneMobileLayoutProps) {
   return (
      <section className="relative min-h-[calc(100vh-140px)] bg-[#f1f2f4] lg:hidden">
         <BookingZoneMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            mobileExpanded={!isCaptchaOpen && !isZoneDrawerOpen}
            stadiumImage={stadiumImage}
            stadiumImageAlt={stadiumImageAlt}
         />
         {!isCaptchaOpen ? (
            <Drawer open={isZoneDrawerOpen} onOpenChange={onOpenChange} modal={false}>
               {!isZoneDrawerOpen ? (
                  <div className="absolute inset-x-0 bottom-0 z-10">
                     <DrawerTrigger asChild>
                        <button
                           type="button"
                           className="w-full rounded-t-[16px] bg-elevated px-5 py-4 text-left shadow-[0_-6px_24px_rgba(0,0,0,0.16)]"
                        >
                           <div className="mb-3 flex justify-center" aria-hidden="true">
                              <div className="h-1 w-9 rounded-full bg-border-light" />
                           </div>
                           <div className="flex items-center justify-between gap-3">
                              <span className="text-heading-3-bold text-foreground">
                                 {bookingFlowMode === 'resell' ? '리셀 좌석 구역' : '좌석 등급/잔여석'}
                              </span>
                              <span className="text-body-1-medium text-tertiary">{zones.length}개 구역</span>
                           </div>
                        </button>
                     </DrawerTrigger>
                  </div>
               ) : null}
               <DrawerContent
                  showOverlay={false}
                  resizable
                  defaultHeight={360}
                  minHeight={232}
                  maxHeight={488}
                  className="overflow-hidden border-none p-0"
               >
                  <div className="h-full overflow-y-auto">
                     <BookingZoneList
                        variant="drawer"
                        zones={zones}
                        selectedZoneId={selectedZoneId}
                        onSelectZone={onSelectZone}
                     />
                  </div>
               </DrawerContent>
            </Drawer>
         ) : null}
      </section>
   );
}

export default BookingZoneMobileLayout;
