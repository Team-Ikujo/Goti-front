import type { ResellListingItem, ResellZoneInsights } from '@/pages/books/model/resellData';
import type { ZoneItem } from '@/pages/books/model/types';
import { Button } from '@/shared/ui/button';
import { formatPrice } from '@/pages/books/model/zoneData';
import { cn } from '@/shared/lib/utils';
import ResellPriceChart from './ResellPriceChart';

type ResellZonePreviewSheetProps = {
   insights: ResellZoneInsights;
   zone: ZoneItem;
   selectedListingId?: string;
   onSelectListing?: (listing: ResellListingItem) => void;
   submitLabel?: string;
   submitDisabled?: boolean;
   onSubmit?: () => void;
};

function ResellZonePreviewSheet({
   insights,
   zone,
   selectedListingId,
   onSelectListing,
   submitLabel,
   submitDisabled,
   onSubmit,
}: ResellZonePreviewSheetProps) {
   return (
      <div className="flex h-full flex-col overflow-y-auto pb-8">
         <section className="space-y-5 px-5 pt-5">
            <ResellPriceChart insights={insights} zoneName={zone.name} height={179} />
         </section>

         <section className="space-y-4 pt-12">
            <div className="px-5">
               <h3 className="text-heading-3-bold text-foreground">최근 거래 내역</h3>
            </div>
            <ul className="space-y-1 px-5">
               {insights.tradeHistory.map((item) => (
                  <li key={item.id} className="grid grid-cols-[max-content_minmax(0,1fr)_66px] items-center gap-x-3 text-body-2-regular text-secondary">
                     <span className="whitespace-nowrap text-body-1-semibold">{formatPrice(item.price)}</span>
                     <span className="min-w-0 truncate text-right">{item.seatLabel}</span>
                     <span className="whitespace-nowrap text-right text-caption-1-regular text-tertiary">{item.tradedAt}</span>
                  </li>
               ))}
            </ul>
         </section>

         <section className="space-y-3 pt-12">
            <div className="flex items-center gap-1 px-5">
               <h3 className="text-heading-3-bold text-foreground">판매 중인 좌석</h3>
               <span className="text-heading-3-bold text-primary">{insights.listings.length}</span>
            </div>

            <ul className="space-y-3 px-5">
               {insights.listings.map((item) => {
                  const isSelected = item.listingId === selectedListingId;

                  if (onSelectListing) {
                     return (
                        <li key={item.listingId}>
                           <button
                              type="button"
                              onClick={() => onSelectListing(item)}
                              className={cn(
                                 'flex w-full items-start justify-between gap-4 rounded-[12px] bg-background px-4 py-4 text-left transition-colors',
                                 isSelected ? 'border-2 border-primary' : 'border border-border-light',
                              )}
                           >
                              <span className="text-body-1-semibold text-secondary">{item.seatLabel}</span>
                              <span className={cn('shrink-0 text-body-1-bold', isSelected ? 'text-primary' : 'text-secondary')}>
                                 {formatPrice(item.listingPrice)}
                              </span>
                           </button>
                        </li>
                     );
                  }

                  return (
                     <li key={item.listingId} className="flex w-full items-start gap-6 rounded-[12px] border border-border-light bg-background px-4 py-4">
                        <span className="flex-1 text-body-1-semibold text-secondary">{item.seatLabel}</span>
                        <span className="shrink-0 text-body-1-bold text-secondary">{formatPrice(item.listingPrice)}</span>
                     </li>
                  );
               })}
            </ul>
         </section>

         {submitLabel && onSubmit ? (
            <div className="px-5 pt-5">
               <Button
                  type="button"
                  disabled={submitDisabled}
                  className="h-12 w-full rounded-[8px]"
                  onClick={onSubmit}
               >
                  {submitLabel}
               </Button>
            </div>
         ) : null}
      </div>
   );
}

export default ResellZonePreviewSheet;
