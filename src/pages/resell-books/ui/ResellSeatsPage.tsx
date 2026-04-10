import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { SeatItem } from '@/pages/books/model/types';
import { buildResellPaymentEntry } from '@/pages/books/model/buildSeatPaymentEntry';
import { useResellSeatSelection } from '@/pages/books/model/useResellSeatSelection';
import { useSeatMapLayout } from '@/pages/books/model/useSeatMapLayout';
import { useSeatMapViewport } from '@/pages/books/model/useSeatMapViewport';
import { useSeatsPageEntry } from '@/pages/books/model/useSeatsPageEntry';
import { useZoneSeatState } from '@/pages/books/model/useZoneSeatState';
import { logBookingFlow, summarizeBookingEntry } from '@/shared/lib/bookingFlowDebug';
import { useBotDetector } from '@/shared/lib/useBotDetector';
import { Drawer, DrawerContent, DrawerTrigger } from '@/shared/ui/drawer';

import ResellSeatSidebar from '@/pages/books/ui/components/ResellSeatSidebar';
import ResellZonePreviewSheet from '@/pages/books/ui/components/ResellZonePreviewSheet';
import SeatMapStage from '@/pages/books/ui/components/SeatMapStage';

function ResellSeatsPage() {
   const navigate = useNavigate();
   const { zoneId = '' } = useParams();
   const { getBotReport } = useBotDetector();
   const botData = getBotReport() ?? undefined;
   const { bookingEntryState, bookingZones, stadiumName, zone, zoneOverviewImage } = useSeatsPageEntry(zoneId);
   const {
      isSeatInteractionLocked,
      pendingSeatIds,
      seatBlocks,
      seats,
   } = useZoneSeatState({
      bookingEntryState,
      bookingZones,
      preferMockSeatMap: true,
      zone,
   });
   const [isSeatDrawerOpen, setIsSeatDrawerOpen] = useState(true);
   const resellSeatSelection = useResellSeatSelection({
      bookingEntryState,
      isResellMode: true,
      isSeatInteractionLocked,
      seats,
      zone,
   });
   const baseSeatMapLayout = useSeatMapLayout({
      mapViewportSize: { width: 0, height: 0 },
      seatBlocks,
      seatMapOffset: { x: 0, y: 0 },
      seatMapScale: 1,
   });
   const seatMapViewport = useSeatMapViewport({
      sectionBounds: baseSeatMapLayout.sectionBounds,
      stageWidth: baseSeatMapLayout.stageSize.width,
      zoneId: zone.id,
   });
   const seatMapLayout = useSeatMapLayout({
      mapViewportSize: seatMapViewport.mapViewportSize,
      seatBlocks,
      seatMapOffset: seatMapViewport.seatMapOffset,
      seatMapScale: seatMapViewport.seatMapScale,
   });

   useEffect(() => {
      logBookingFlow('ResellSeatsPage', 'render snapshot', {
         zoneId,
         bookingEntryState: summarizeBookingEntry(bookingEntryState),
         bookingZoneCount: bookingZones.length,
         selectedSeatCount: resellSeatSelection.selectedSeatCount,
         allSelectedSeatsAreHeld:
            Boolean(resellSeatSelection.selectedResellListing) && Boolean(resellSeatSelection.selectedResellHoldId),
         isSeatInteractionLocked,
         isResellInsightsPending: resellSeatSelection.resellInsightsQuery.isPending,
      });
   }, [bookingEntryState, bookingZones.length, isSeatInteractionLocked, resellSeatSelection.resellInsightsQuery.isPending, resellSeatSelection.selectedResellHoldId, resellSeatSelection.selectedResellListing, resellSeatSelection.selectedSeatCount, zoneId]);

   useEffect(() => {
      const mediaQuery = window.matchMedia('(min-width: 1280px)');
      const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
         if (event.matches) {
            setIsSeatDrawerOpen(false);
         }
      };

      handleChange(mediaQuery);
      mediaQuery.addEventListener('change', handleChange);

      return () => {
         mediaQuery.removeEventListener('change', handleChange);
      };
   }, []);

   const handleProceedToPayment = () => {
      logBookingFlow('ResellSeatsPage', 'handleProceedToPayment', {
         selectedSeatCount: resellSeatSelection.selectedSeatCount,
         bookingEntryState: summarizeBookingEntry(bookingEntryState),
      });
      if (!resellSeatSelection.selectedResellListing) {
         return;
      }

      resellSeatSelection.persistResellHoldRef.current = true;
      navigate('/tickets/resell-payment', {
         state: buildResellPaymentEntry({
            bookingEntryState,
            botData,
            holdId: resellSeatSelection.selectedResellHoldId,
            listing: resellSeatSelection.selectedResellListing,
         }),
      });
   };

   const toggleSeat = (seat: SeatItem) => {
      logBookingFlow('ResellSeatsPage', 'toggleSeat', {
         seat,
         isSeatInteractionLocked,
         pendingSeatIds,
      });
      if (isSeatInteractionLocked) {
         return;
      }

      if (pendingSeatIds.includes(seat.id) || resellSeatSelection.isResellHoldPending) {
         return;
      }

      if (seat.status === 'disabled' || seat.status === 'held') {
         return;
      }

      const listing = resellSeatSelection.seatIdByResellListingId
         ? resellSeatSelection.resellInsights?.listings.find(
              item => resellSeatSelection.seatIdByResellListingId.get(item.listingId) === seat.id,
           )
         : null;

      if (!listing) {
         return;
      }

      void resellSeatSelection.handleSelectResellListing(seat.id, listing);
   };

   return (
      <div className="w-full bg-background text-foreground">
         <main className="flex min-h-[calc(100vh-140px)] flex-col xl:h-[calc(100vh-140px)] xl:flex-row">
            <section className="relative flex min-h-[660px] flex-1 flex-col overflow-hidden bg-[#eef0f3] xl:min-h-[680px]">
               <div className="flex items-center justify-between gap-4 px-5 py-5 lg:px-8 lg:py-3">
                  <div className="inline-flex min-w-0 items-center gap-2 rounded-[12px] bg-background px-4 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:px-3">
                     <span className="inline-flex items-center justify-center rounded-[8px] bg-primary-light px-2 py-1 text-caption-1-bold text-primary">
                        선택 구역
                     </span>
                     <span className="truncate text-body-1-bold text-foreground">{zone.name}</span>
                  </div>
               </div>

               <div className="relative flex-1 overflow-hidden px-0 pb-[144px] lg:px-8 lg:pb-6 xl:pb-6">
                  <SeatMapStage
                     directionBadgePosition={seatMapLayout.directionBadgePosition}
                     isSeatMapDragging={seatMapViewport.isSeatMapDragging}
                     mapViewportRef={seatMapViewport.mapViewportRef}
                     minimapLayout={seatMapLayout.minimapLayout}
                     minimapViewport={seatMapLayout.minimapViewport}
                     seatBlocks={seatBlocks}
                     seatMapOffset={seatMapViewport.seatMapOffset}
                     seatMapScale={seatMapViewport.seatMapScale}
                     stageSize={seatMapLayout.stageSize}
                     seats={resellSeatSelection.displaySeats}
                     selectedSeatIdSet={resellSeatSelection.selectedSeatIdSet}
                     zoneColor={zone.color}
                     zoneName={zone.name}
                     onMapPointerDown={seatMapViewport.onMapPointerDown}
                     onMapPointerMove={seatMapViewport.onMapPointerMove}
                     onMapPointerUp={seatMapViewport.onMapPointerUp}
                     onResetSeatMapView={seatMapViewport.resetSeatMapView}
                     onToggleSeat={toggleSeat}
                     onUpdateSeatMapScale={seatMapViewport.onUpdateSeatMapScale}
                  />
               </div>

               <Drawer open={isSeatDrawerOpen} onOpenChange={setIsSeatDrawerOpen} modal={false}>
                  {!isSeatDrawerOpen ? (
                     <div className="absolute inset-x-0 bottom-0 z-10 xl:hidden">
                        <DrawerTrigger asChild>
                           <button
                              type="button"
                              className="w-full rounded-t-[16px] bg-elevated px-5 py-4 text-left shadow-[0_-6px_24px_rgba(0,0,0,0.16)]"
                           >
                              <div className="mb-3 flex justify-center" aria-hidden="true">
                                 <div className="h-1 w-9 rounded-full bg-border-light" />
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                 <div className="flex items-center gap-1 text-heading-3-bold text-foreground">
                                    <span>리셀 예매</span>
                                    <span className="text-primary">{resellSeatSelection.selectedSeatCount}</span>
                                 </div>
                                 <span className="text-body-1-medium text-tertiary">
                                    {resellSeatSelection.selectedSeatCount > 0
                                       ? `${resellSeatSelection.summaryPrice.toLocaleString('ko-KR')}원`
                                       : '열기'}
                                 </span>
                              </div>
                           </button>
                        </DrawerTrigger>
                     </div>
                  ) : null}
                  <DrawerContent
                     showOverlay={false}
                     resizable
                     defaultHeight={488}
                     minHeight={280}
                     maxHeight={560}
                     className="overflow-hidden border-none p-0 xl:hidden"
                  >
                     <div className="h-full overflow-y-auto">
                        {resellSeatSelection.resellInsightsQuery.isPending ? (
                           <div className="flex h-full min-h-[240px] items-center justify-center px-5 text-center text-body-1-medium text-muted-foreground">
                              리셀 좌석 정보를 불러오는 중입니다.
                           </div>
                        ) : resellSeatSelection.resellInsightsQuery.isError ? (
                           <div className="flex h-full min-h-[240px] items-center justify-center px-5 text-center text-body-1-medium text-muted-foreground">
                              리셀 좌석 정보를 불러오지 못했습니다.
                           </div>
                        ) : resellSeatSelection.resellInsights ? (
                           <ResellZonePreviewSheet
                              insights={resellSeatSelection.resellInsights}
                              zone={zone}
                              selectedListingId={resellSeatSelection.selectedResellListing?.listingId}
                              onSelectListing={listing => {
                                 const mappedSeatId = resellSeatSelection.seatIdByResellListingId.get(listing.listingId);

                                 if (!mappedSeatId) {
                                    return;
                                 }

                                 void resellSeatSelection.handleSelectResellListing(mappedSeatId, listing);
                              }}
                              submitLabel="예매하기"
                              submitDisabled={!resellSeatSelection.selectedResellListing}
                              onSubmit={handleProceedToPayment}
                           />
                        ) : null}
                     </div>
                  </DrawerContent>
               </Drawer>
            </section>

            {resellSeatSelection.resellInsightsQuery.isPending ? (
               <aside className="hidden w-full shrink-0 items-center justify-center border-l border-border-light bg-background px-5 text-center text-body-1-medium text-muted-foreground xl:flex xl:w-[420px]">
                  리셀 좌석 정보를 불러오는 중입니다.
               </aside>
            ) : resellSeatSelection.resellInsights ? (
               <ResellSeatSidebar
                  insights={resellSeatSelection.resellInsights}
                  selectedListingId={resellSeatSelection.selectedResellListing?.listingId}
                  zone={zone}
                  zoneOverviewImage={zoneOverviewImage}
                  stadiumName={stadiumName}
                  onSelectListing={listing => {
                     const mappedSeatId = resellSeatSelection.seatIdByResellListingId.get(listing.listingId);

                     if (!mappedSeatId) {
                        return;
                     }

                     void resellSeatSelection.handleSelectResellListing(mappedSeatId, listing);
                  }}
                  onSubmit={handleProceedToPayment}
               />
            ) : resellSeatSelection.resellInsightsQuery.isError ? (
               <aside className="hidden w-full shrink-0 items-center justify-center border-l border-border-light bg-background px-5 text-center text-body-1-medium text-muted-foreground xl:flex xl:w-[420px]">
                  리셀 좌석 정보를 불러오지 못했습니다.
               </aside>
            ) : null}
         </main>
      </div>
   );
}

export default ResellSeatsPage;
