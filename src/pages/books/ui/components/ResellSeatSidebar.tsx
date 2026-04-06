import { Button } from '@/shared/ui/button';
import { formatPrice } from '@/pages/books/model/zoneData';
import type { ZoneItem } from '@/pages/books/model/types';
import type { ResellListingItem, ResellZoneInsights } from '@/pages/books/model/resellData';
import { cn } from '@/shared/lib/utils';
import ResellPriceChart from './ResellPriceChart';

type ResellSeatSidebarProps = {
   insights: ResellZoneInsights;
   selectedListingId?: string;
   zone: ZoneItem;
   zoneOverviewImage: string;
   stadiumName: string;
   onSelectListing: (listing: ResellListingItem) => void;
   onSubmit: () => void;
};

function ResellSeatSidebar({
   insights,
   selectedListingId,
   zone,
   zoneOverviewImage,
   stadiumName,
   onSelectListing,
   onSubmit,
}: ResellSeatSidebarProps) {
   return (
      <aside className="hidden w-full shrink-0 flex-col overflow-hidden border-l border-border-light bg-background xl:flex xl:w-[420px]">
         <div className="relative h-[220px] overflow-hidden border-b border-border-light bg-[#e9ebee] px-5 py-2.5">
            <div className="relative mx-auto h-[200px] w-[200px] shrink-0">
               <img
                  src={zoneOverviewImage}
                  alt={`${stadiumName} ${zone.name} 구역 좌석도`}
                  className="h-full w-full object-contain opacity-70"
                  draggable={false}
               />
            </div>
         </div>

         <div className="flex flex-1 flex-col gap-12 overflow-y-auto pb-5">
            <section className="space-y-6 px-5 pt-5">
               <ResellPriceChart insights={insights} zoneName={zone.name} height={200} />
            </section>

            <section className="space-y-4">
               <div className="px-5">
                  <h3 className="text-heading-3-bold text-foreground">최근 거래 내역</h3>
               </div>
               <ul className="space-y-1 px-5">
                  {insights.tradeHistory.map((item) => (
                     <li key={item.id} className="grid grid-cols-[max-content_minmax(0,1fr)_88px] items-center gap-x-3 text-body-2-regular text-secondary">
                        <span className="whitespace-nowrap text-body-2-semibold">{formatPrice(item.price)}</span>
                        <span className="min-w-0 truncate text-right">{item.seatLabel}</span>
                        <span className="whitespace-nowrap text-right text-caption-1-regular text-tertiary">{item.tradedAt}</span>
                     </li>
                  ))}
               </ul>
            </section>

            <section className="space-y-3">
               <div className="flex items-center gap-1 px-5">
                  <h3 className="text-heading-3-bold text-foreground">판매 중인 좌석</h3>
                  <span className="text-heading-3-bold text-primary">{insights.listings.length}</span>
               </div>

               <ul className="space-y-3 px-5">
                  {insights.listings.map((item) => {
                     const isSelected = item.listingId === selectedListingId;

                     return (
                        <li key={item.listingId}>
                           <button
                              type="button"
                              onClick={() => onSelectListing(item)}
                              className={cn(
                                 'flex w-full items-start gap-6 rounded-[12px] bg-background px-4 py-4 text-left transition-colors',
                                 isSelected ? 'border-2 border-primary' : 'border border-border-light hover:border-primary/40',
                              )}
                              aria-pressed={isSelected}
                           >
                              <span className="flex-1 text-body-1-semibold text-secondary">{item.seatLabel}</span>
                              <span className={cn('shrink-0 text-body-1-bold', isSelected ? 'text-primary' : 'text-secondary')}>
                                 {formatPrice(item.listingPrice)}
                              </span>
                           </button>
                        </li>
                     );
                  })}
               </ul>
            </section>
         </div>

         <div className="px-5 pb-5">
            <Button
               type="button"
               disabled={!selectedListingId}
               className="h-12 w-full rounded-[8px]"
               onClick={onSubmit}
            >
               예매하기
            </Button>
         </div>
      </aside>
   );
}

export default ResellSeatSidebar;
