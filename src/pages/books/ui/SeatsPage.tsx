import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { SeatItem } from '@/pages/books/model/types';
import { buildResellPaymentEntry } from '@/pages/books/model/buildSeatPaymentEntry';
import { useBookingPurchaseLimit } from '@/pages/books/model/useBookingPurchaseLimit';
import { useResellSeatSelection } from '@/pages/books/model/useResellSeatSelection';
import { useSeatMapLayout } from '@/pages/books/model/useSeatMapLayout';
import { useSeatMapViewport } from '@/pages/books/model/useSeatMapViewport';
import { useSeatsPageEntry } from '@/pages/books/model/useSeatsPageEntry';
import { useZoneSeatState } from '@/pages/books/model/useZoneSeatState';
import { formatPrice } from '@/pages/books/model/zoneData';
import { isResaleBookingMockEnabled } from '@/shared/config/runtime';
import { useBotDetector } from '@/shared/lib/useBotDetector';
import { Drawer, DrawerContent, DrawerTrigger } from '@/shared/ui/drawer';
import BooksPurchaseLimitDialog from '@/shared/widgets/layout/books/BooksPurchaseLimitDialog';

import ResellSeatSidebar from './components/ResellSeatSidebar';
import ResellZonePreviewSheet from './components/ResellZonePreviewSheet';
import SeatMapStage from './components/SeatMapStage';
import SelectedSeatSummaryList from './components/SelectedSeatSummaryList';

function SeatsPage() {
   const navigate = useNavigate();
   const { zoneId = '' } = useParams();
   const { getBotReport } = useBotDetector();
   const botData = getBotReport() ?? undefined;
   const { bookingEntryState, hasBookingEntryHydrated, isResellMode, bookingZones, stadiumName, zone, zoneOverviewImage } =
      useSeatsPageEntry(zoneId);
   const [isPurchaseLimitDialogOpen, setIsPurchaseLimitDialogOpen] = useState(false);
   const purchaseLimit = useBookingPurchaseLimit();
   const {
      allSelectedSeatsAreHeld: allStandardSelectedSeatsAreHeld,
      clearSelectedSeats,
      hasApiSeatMap,
      holdSeat,
      holdsBySeatId,
      isSeatMapError,
      seatMapErrorMessage,
      isSeatInteractionLocked,
      pendingSeatIds,
      releaseSeat,
      seatBlocks,
      seats,
      selectedPrice,
      selectedSeatIds,
      selectedSeats,
   } = useZoneSeatState({
      bookingEntryState,
      bookingZones,
      hasBookingEntryHydrated,
      onPurchaseLimitReached: () => setIsPurchaseLimitDialogOpen(true),
      preferMockSeatMap: isResellMode && isResaleBookingMockEnabled,
      zone,
   });
   const [isSeatDrawerOpen, setIsSeatDrawerOpen] = useState(true);
   const standardSelectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
   const resellSeatSelection = useResellSeatSelection({
      bookingEntryState,
      isResellMode,
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
   const selectedSeatIdSet = isResellMode ? resellSeatSelection.selectedSeatIdSet : standardSelectedSeatIdSet;
   const selectedSeatCount = isResellMode ? resellSeatSelection.selectedSeatCount : selectedSeats.length;
   const summaryPrice = isResellMode ? resellSeatSelection.summaryPrice : selectedPrice;
   const allSelectedSeatsAreHeld = isResellMode
      ? Boolean(resellSeatSelection.selectedResellListing) && Boolean(resellSeatSelection.selectedResellHoldId)
      : allStandardSelectedSeatsAreHeld;
   const bookingButtonLabel = isResellMode ? '예매하기' : `${selectedSeats.length}매 예매하기`;
   const displaySeats = useMemo(() => {
      if (isResellMode) {
         return resellSeatSelection.displaySeats;
      }

      if (isSeatInteractionLocked || !hasApiSeatMap) {
         return seats.map(
            seat =>
               ({
                  ...seat,
                  status: 'disabled',
               }) satisfies SeatItem,
         );
      }

      return seats;
   }, [isResellMode, isSeatInteractionLocked, resellSeatSelection.displaySeats, seats]);

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

   const handleProceedToPayment = async () => {
      if (isResellMode) {
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
         return;
      }

      try {
         const purchaseLimitResult = await purchaseLimit.checkPurchaseLimit({
            gameId: bookingEntryState?.gameId,
            selectedSeatCount: selectedSeats.length,
         });

         if (purchaseLimitResult.isLimitExceeded) {
            setIsPurchaseLimitDialogOpen(true);
            return;
         }
      } catch (error) {
         console.error('[SeatsPage] 구매 제한 사전 체크 실패', error);
      }

      navigate('/tickets/payment', {
         state: bookingEntryState,
      });
   };

   const toggleSeat = (seat: SeatItem) => {
      if (isSeatInteractionLocked) {
         return;
      }

      if (!isResellMode && !hasApiSeatMap) {
         if (isSeatMapError && seatMapErrorMessage) {
            window.alert(seatMapErrorMessage);
         }
         return;
      }

      if (pendingSeatIds.includes(seat.id) || resellSeatSelection.isResellHoldPending) {
         return;
      }

      if (seat.status === 'disabled' || seat.status === 'held') {
         return;
      }

      if (isResellMode) {
         const listing = resellSeatSelection.seatIdByResellListingId
            ? resellSeatSelection.resellInsights?.listings.find(
                 item => resellSeatSelection.seatIdByResellListingId.get(item.listingId) === seat.id,
              )
            : null;

         if (!listing) {
            return;
         }

         void resellSeatSelection.handleSelectResellListing(seat.id, listing);
         return;
      }

      void holdSeat(zone.id, seat);
   };

   const handleRemoveSelectedSeat = (selectedZoneId: string, seatId: string) => {
      if (isResellMode) {
         void resellSeatSelection.releaseSelectedResellHold();
         return;
      }

      const seatHold = holdsBySeatId[seatId];

      void releaseSeat({
         zoneId: selectedZoneId,
         seatId,
         holdId: seatHold?.holdId,
      });
   };

   const handleClearSelectedSeats = () => {
      if (isResellMode) {
         void resellSeatSelection.releaseSelectedResellHold();
         return;
      }

      void clearSelectedSeats(selectedSeats);
   };

   return (
      <div className="w-full bg-background text-foreground">
         <BooksPurchaseLimitDialog
            open={isPurchaseLimitDialogOpen}
            onConfirm={() => {
               setIsPurchaseLimitDialogOpen(false);
               navigate('/books', {
                  replace: true,
                  state: bookingEntryState ?? undefined,
               });
            }}
         />
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
                     seats={displaySeats}
                     selectedSeatIdSet={selectedSeatIdSet}
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
                                    <span>{isResellMode ? '리셀 예매' : '선택 좌석'}</span>
                                    <span className="text-primary">{selectedSeatCount}</span>
                                 </div>
                                 <span className="text-body-1-medium text-tertiary">
                                    {selectedSeatCount > 0 ? formatPrice(summaryPrice) : '열기'}
                                 </span>
                              </div>
                           </button>
                        </DrawerTrigger>
                     </div>
                  ) : null}
                  <DrawerContent
                     showOverlay={false}
                     resizable
                     defaultHeight={isResellMode ? 488 : 280}
                     minHeight={isResellMode ? 280 : 152}
                     maxHeight={560}
                     className="overflow-hidden border-none p-0 xl:hidden"
                  >
                     <div className="h-full overflow-y-auto">
                        {isResellMode && resellSeatSelection.resellInsightsQuery.isPending ? (
                           <div className="flex h-full min-h-[240px] items-center justify-center px-5 text-center text-body-1-medium text-muted-foreground">
                              리셀 좌석 정보를 불러오는 중입니다.
                           </div>
                        ) : isResellMode && resellSeatSelection.resellInsightsQuery.isError ? (
                           <div className="flex h-full min-h-[240px] items-center justify-center px-5 text-center text-body-1-medium text-muted-foreground">
                              리셀 좌석 정보를 불러오지 못했습니다.
                           </div>
                        ) : isResellMode && resellSeatSelection.resellInsights ? (
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
                              submitLabel={bookingButtonLabel}
                              submitDisabled={!resellSeatSelection.selectedResellListing}
                              onSubmit={handleProceedToPayment}
                           />
                        ) : (
                           <>
                              <div className="flex items-center justify-between gap-3 px-5 py-4">
                                 <div className="flex items-center gap-1 text-heading-3-bold text-foreground">
                                    <h2>선택 좌석</h2>
                                    <span className="text-primary">{selectedSeats.length}</span>
                                 </div>
                                 {selectedSeats.length > 0 ? (
                                    <button
                                       type="button"
                                       onClick={handleClearSelectedSeats}
                                       className="text-body-1-medium text-tertiary transition-colors hover:text-foreground"
                                    >
                                       전체 삭제
                                    </button>
                                 ) : null}
                              </div>

                              <div className="px-5 pb-4">
                                 <SelectedSeatSummaryList
                                    items={selectedSeats}
                                    onRemove={handleRemoveSelectedSeat}
                                    emptyClassName="h-full min-h-[220px] bg-transparent"
                                 />
                              </div>

                              <div className="px-5 pb-5">
                                 <div className="flex items-center justify-between gap-3 px-1 pb-5 text-heading-4-medium text-secondary">
                                    <span>총 결제 금액</span>
                                    <span className="text-heading-4-bold text-primary">
                                       {formatPrice(summaryPrice)}
                                    </span>
                                 </div>
                                 <button
                                    type="button"
                                    disabled={selectedSeats.length === 0 || !allSelectedSeatsAreHeld || purchaseLimit.isChecking}
                                    onClick={() => void handleProceedToPayment()}
                                    className={[
                                       'h-12 w-full rounded-[8px] text-label-1-bold transition-colors',
                                       selectedSeats.length === 0 || !allSelectedSeatsAreHeld || purchaseLimit.isChecking
                                          ? 'bg-fill-disabled text-disabled-foreground'
                                          : 'bg-primary text-white hover:bg-primary-strong',
                                    ].join(' ')}
                                 >
                                    {purchaseLimit.isChecking ? '구매 가능 수량 확인 중' : bookingButtonLabel}
                                 </button>
                              </div>
                           </>
                        )}
                     </div>
                  </DrawerContent>
               </Drawer>
            </section>

            {isResellMode && resellSeatSelection.resellInsightsQuery.isPending ? (
               <aside className="hidden w-full shrink-0 items-center justify-center border-l border-border-light bg-background px-5 text-center text-body-1-medium text-muted-foreground xl:flex xl:w-[420px]">
                  리셀 좌석 정보를 불러오는 중입니다.
               </aside>
            ) : isResellMode && resellSeatSelection.resellInsights ? (
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
                  onSubmit={() => void handleProceedToPayment()}
               />
            ) : isResellMode && resellSeatSelection.resellInsightsQuery.isError ? (
               <aside className="hidden w-full shrink-0 items-center justify-center border-l border-border-light bg-background px-5 text-center text-body-1-medium text-muted-foreground xl:flex xl:w-[420px]">
                  리셀 좌석 정보를 불러오지 못했습니다.
               </aside>
            ) : (
               <aside className="hidden w-full shrink-0 flex-col border-l border-border-light bg-background xl:flex xl:w-[420px]">
                  <div className="relative h-[220px] overflow-hidden border-b border-border-light bg-[#e9ebee] px-5 py-4">
                     <div className="relative mx-auto h-[188px] w-[260px] shrink-0">
                        <img
                           src={zoneOverviewImage}
                           alt={`${zone.name} 선택 상태가 반영된 ${stadiumName} 좌석도`}
                           className="h-full w-full object-contain"
                           draggable={false}
                        />
                     </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-5">
                     <div className="flex items-center gap-2">
                        <h2 className="text-heading-3-bold text-foreground">선택 좌석</h2>
                        {selectedSeats.length > 0 ? (
                           <span className="text-heading-4-bold text-primary">{selectedSeats.length}</span>
                        ) : null}
                     </div>
                     {selectedSeats.length > 0 ? (
                        <button
                           type="button"
                           onClick={handleClearSelectedSeats}
                           className="text-body-2-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                           전체 삭제
                        </button>
                     ) : null}
                  </div>

                  <div className="flex flex-1 flex-col px-5 pb-5">
                     <div className="flex-1 overflow-y-auto rounded-2xl bg-background">
                        <SelectedSeatSummaryList
                           items={selectedSeats}
                           onRemove={handleRemoveSelectedSeat}
                           emptyClassName="h-full min-h-[220px] bg-transparent"
                        />
                     </div>

                     <div className="flex items-center justify-between gap-3 px-1 pb-5 pt-6 text-heading-4-medium text-secondary">
                        <span>총 결제 금액</span>
                        <span className="text-heading-4-bold text-primary">{formatPrice(summaryPrice)}</span>
                     </div>

                     <button
                        type="button"
                        disabled={selectedSeats.length === 0 || !allSelectedSeatsAreHeld || purchaseLimit.isChecking}
                        onClick={() => void handleProceedToPayment()}
                        className={[
                           'h-[56px] w-full rounded-[8px] text-label-1-bold transition-colors',
                           selectedSeats.length === 0 || !allSelectedSeatsAreHeld || purchaseLimit.isChecking
                              ? 'bg-fill-disabled text-disabled-foreground'
                              : 'bg-primary text-white hover:bg-primary-strong',
                        ].join(' ')}
                     >
                        {purchaseLimit.isChecking ? '구매 가능 수량 확인 중' : bookingButtonLabel}
                     </button>
                  </div>
               </aside>
            )}
         </main>
      </div>
   );
}

export default SeatsPage;
