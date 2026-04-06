import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { PointerEvent as ReactPointerEvent } from 'react';

import { createSeatsForZone } from '@/pages/books/model/seatData';
import type { ResellListingItem } from '@/pages/books/model/resellData';
import { getSelectedSeatDetails } from '@/pages/books/model/selectedSeats';
import { useSeatHoldActions } from '@/pages/books/model/useSeatHoldActions';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { useSeatMapData } from '@/pages/books/model/useSeatMapData';
import { useResellZoneInsights } from '@/pages/books/model/useResellZoneInsights';
import {
   holdResaleListing,
   releaseResaleListingHold,
   releaseResaleListingHoldKeepalive,
} from '@/entities/resale/api/resaleApi';
import { formatPrice, getBookingZones, getZoneOverviewImage, getStadiumName } from '@/pages/books/model/zoneData';
import type { SeatItem } from '@/pages/books/model/types';
import { getBookingFlowMode } from '@/shared/lib/booking-flow';
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import { useBotDetector } from '@/shared/lib/useBotDetector';
import { Drawer, DrawerContent, DrawerTrigger } from '@/shared/ui/drawer';
import SeatMapStage from './components/SeatMapStage';
import ResellSeatSidebar from './components/ResellSeatSidebar';
import ResellZonePreviewSheet from './components/ResellZonePreviewSheet';
import SelectedSeatSummaryList from './components/SelectedSeatSummaryList';

const MIN_SCALE = 0.8;
const MAX_SCALE = 2.4;
const STAGE_WIDTH = 1240;
const STAGE_HEIGHT = 620;
const BLOCK_SEAT_SIZE = 18;
const BLOCK_SEAT_GAP = 2;
const BLOCK_CARD_PADDING_X = 24;
const BLOCK_CARD_PADDING_TOP = 32;
const BLOCK_CARD_PADDING_BOTTOM = 32;
const BLOCK_CARD_LABEL_HEIGHT = 28;
const BLOCK_CARD_LABEL_GAP = 24;
const BLOCK_CARD_COLUMN_GAP = 48;
const DEFAULT_SEAT_MAP_LEFT_PADDING = 24;
const DEFAULT_SEAT_MAP_TOP_PADDING = 24;
const MINIMAP_WIDTH = 215;
const MINIMAP_HEIGHT = 140;
const MINIMAP_PADDING_X = 24;
const MINIMAP_PADDING_Y = 18;

const normalizeSeatLookupToken = (value: string) => value.replace(/\s+/g, '').toUpperCase();

const parseResellSeatInfo = (seatInfo: string) => {
   const sectionMatch = seatInfo.match(/([A-Z0-9-]+)구역/i);
   const rowMatch = seatInfo.match(/([A-Z0-9가-힣]+)열/i);
   const seatNumberMatch = seatInfo.match(/(\d+)번/);

   if (!sectionMatch || !rowMatch || !seatNumberMatch) {
      return null;
   }

   return {
      sectionCode: normalizeSeatLookupToken(sectionMatch[1]),
      rowLabel: `${rowMatch[1]}열`,
      seatNumber: Number(seatNumberMatch[1]),
   };
};

function SeatsPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const { zoneId = '' } = useParams();
   const bookingFlowMode = getBookingFlowMode(location.search);
   const isResellMode = bookingFlowMode === 'resell';
   const routeBookingEntryState = location.state as BookingEntryState | null;
   const storedBookingEntryState = useBookingEntryStore(state => state.entry);
   const bookingEntryState = routeBookingEntryState ?? storedBookingEntryState;
   const setBookingEntry = useBookingEntryStore(state => state.setEntry);
   const { getBotReport } = useBotDetector();
   const botData = getBotReport();
   const bookingZones = useMemo(
      () => bookingEntryState?.bookingZones ?? getBookingZones(bookingEntryState?.homeTeamId),
      [bookingEntryState?.bookingZones, bookingEntryState?.homeTeamId],
   );

   const zone = useMemo(() => bookingZones.find(item => item.id === zoneId) ?? bookingZones[0], [bookingZones, zoneId]);
   const zoneOverviewImage = useMemo(
      () => getZoneOverviewImage(bookingEntryState?.homeTeamId, zone.id),
      [bookingEntryState?.homeTeamId, zone.id],
   );
   const stadiumName = useMemo(() => getStadiumName(bookingEntryState?.homeTeamId), [bookingEntryState?.homeTeamId]);

   const initialSeats = useMemo(() => createSeatsForZone(zone), [zone]);
   const { apiSeatItems, seatBlocks, hasApiSeatMap, isSeatMapLoading, refetchSeatMap } = useSeatMapData({
      gameId: bookingEntryState?.gameId,
      stadiumId: bookingEntryState?.stadiumId,
      zone,
   });
   const zonesState = useSeatSelectionStore(state => state.zones);
   const zoneSeatState = useSeatSelectionStore(state => state.zones[zone.id]);
   const initializeZone = useSeatSelectionStore(state => state.initializeZone);
   const applyServerSeatSnapshot = useSeatSelectionStore(state => state.applyServerSeatSnapshot);
   const toggleSelectedSeat = useSeatSelectionStore(state => state.toggleSelectedSeat);
   const clearAllSelections = useSeatSelectionStore(state => state.clearAllSelections);
   const holdsBySeatId = useSeatHoldStore(state => state.holdsBySeatId);
   const { clearSelectedSeats, holdSeat, pendingSeatIds, releaseSeat, syncHeldSeatsIntoZone } = useSeatHoldActions(
      bookingEntryState,
      {
         onSeatHoldConflict: async () => {
            await refetchSeatMap();
         },
      },
   );

   const [seatMapScale, setSeatMapScale] = useState(1);
   const [seatMapOffset, setSeatMapOffset] = useState({ x: 0, y: 0 });
   const [isSeatMapDragging, setIsSeatMapDragging] = useState(false);
   const [isSeatDrawerOpen, setIsSeatDrawerOpen] = useState(true);
   const [isResellHoldPending, setIsResellHoldPending] = useState(false);
   const [selectedResellHoldId, setSelectedResellHoldId] = useState<string | null>(null);
   const [selectedResellSeatId, setSelectedResellSeatId] = useState<string | null>(null);
   const dragStartRef = useRef<{ x: number; y: number } | null>(null);
   const mapViewportRef = useRef<HTMLDivElement | null>(null);
   const selectedResellHoldIdRef = useRef<string | null>(null);
   const persistResellHoldRef = useRef(false);
   const [mapViewportSize, setMapViewportSize] = useState({ width: 0, height: 0 });

   useEffect(() => {
      if (routeBookingEntryState) {
         setBookingEntry(routeBookingEntryState);
      }
   }, [routeBookingEntryState, setBookingEntry]);

   useEffect(() => {
      const syncedInitialSeats = syncHeldSeatsIntoZone(zone.id, initialSeats);

      if (hasApiSeatMap && apiSeatItems.length > 0) {
         applyServerSeatSnapshot(zone.id, syncHeldSeatsIntoZone(zone.id, apiSeatItems));
         return;
      }

      initializeZone(zone.id, syncedInitialSeats);
   }, [
      apiSeatItems,
      applyServerSeatSnapshot,
      hasApiSeatMap,
      initialSeats,
      initializeZone,
      syncHeldSeatsIntoZone,
      zone.id,
   ]);

   useEffect(() => {
      const updateViewportSize = () => {
         const element = mapViewportRef.current;

         if (!element) {
            return;
         }

         setMapViewportSize({
            width: element.clientWidth,
            height: element.clientHeight,
         });
      };

      updateViewportSize();
      window.addEventListener('resize', updateViewportSize);

      return () => {
         window.removeEventListener('resize', updateViewportSize);
      };
   }, []);

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

   useEffect(() => {
      if (!isResellMode) {
         setSelectedResellHoldId(null);
         setSelectedResellSeatId(null);
         persistResellHoldRef.current = false;
         return;
      }

      clearAllSelections();
   }, [clearAllSelections, isResellMode, zone.id]);

   useEffect(() => {
      selectedResellHoldIdRef.current = selectedResellHoldId;
   }, [selectedResellHoldId]);

   useEffect(() => {
      if (!isResellMode) {
         return;
      }

      const handlePageHide = () => {
         const holdId = selectedResellHoldIdRef.current;

         if (!holdId || persistResellHoldRef.current) {
            return;
         }

         releaseResaleListingHoldKeepalive(holdId);
      };

      window.addEventListener('pagehide', handlePageHide);

      return () => {
         window.removeEventListener('pagehide', handlePageHide);
      };
   }, [isResellMode]);

   useEffect(() => {
      return () => {
         const holdId = selectedResellHoldIdRef.current;

         if (!isResellMode || !holdId || persistResellHoldRef.current) {
            return;
         }

         releaseResaleListingHoldKeepalive(holdId);
      };
   }, [isResellMode]);

   const seats = useMemo(() => {
      if (!zoneSeatState) {
         return initialSeats;
      }

      return zoneSeatState.seatOrder
         .map(seatId => zoneSeatState.seatMap[seatId])
         .filter((seat): seat is SeatItem => Boolean(seat));
   }, [initialSeats, zoneSeatState]);

   const selectedSeatIds = zoneSeatState?.selectedSeatIds ?? [];
   const selectedSeatIdSet = useMemo(
      () => new Set(isResellMode ? (selectedResellSeatId ? [selectedResellSeatId] : []) : selectedSeatIds),
      [isResellMode, selectedResellSeatId, selectedSeatIds],
   );

   const selectedSeats = useMemo(() => getSelectedSeatDetails(zonesState, bookingZones), [bookingZones, zonesState]);

   const selectedPrice = selectedSeats.reduce((total, item) => total + item.price, 0);
   const isSeatInteractionLocked = Boolean(bookingEntryState?.gameId) && isSeatMapLoading;
   const resellInsightsQuery = useResellZoneInsights({
      enabled: isResellMode,
      gameId: bookingEntryState?.gameId,
      zone,
      seats,
   });
   const resellInsights = resellInsightsQuery.data ?? null;
   const resellListingBySeatId = useMemo(() => {
      const listingBySeatIdentifier = new Map(
         (resellInsights?.listings ?? []).map(listing => [listing.seatId, listing]),
      );
      const seatByLookupKey = new Map(
         seats.map(seat => [`${normalizeSeatLookupToken(seat.block)}::${seat.rowLabel}::${seat.seatNumber}`, seat]),
      );
      const nextMap = new Map<string, ResellListingItem>();

      seats.forEach(seat => {
         const matchedListing = listingBySeatIdentifier.get(seat.id) ?? listingBySeatIdentifier.get(seat.apiSeatId);

         if (matchedListing) {
            nextMap.set(seat.id, matchedListing);
         }
      });

      (resellInsights?.listings ?? []).forEach(listing => {
         if ([...nextMap.values()].some(mappedListing => mappedListing.listingId === listing.listingId)) {
            return;
         }

         const parsedSeatInfo = parseResellSeatInfo(listing.seatInfo);

         if (!parsedSeatInfo) {
            return;
         }

         const matchedSeat = seatByLookupKey.get(
            `${parsedSeatInfo.sectionCode}::${parsedSeatInfo.rowLabel}::${parsedSeatInfo.seatNumber}`,
         );

         if (matchedSeat) {
            nextMap.set(matchedSeat.id, listing);
         }
      });

      return nextMap;
   }, [resellInsights?.listings, seats]);
   const seatIdByResellListingId = useMemo(() => {
      return new Map(
         [...resellListingBySeatId.entries()].map(([seatId, listing]) => [listing.listingId, seatId] as const),
      );
   }, [resellListingBySeatId]);
   const selectedResellListing = useMemo(() => {
      if (!isResellMode) {
         return null;
      }

      return selectedResellSeatId ? (resellListingBySeatId.get(selectedResellSeatId) ?? null) : null;
   }, [isResellMode, resellListingBySeatId, selectedResellSeatId]);
   const selectedSeatCount = isResellMode ? (selectedResellListing ? 1 : 0) : selectedSeats.length;
   const summaryPrice = isResellMode
      ? (selectedResellListing?.totalAmount ?? selectedResellListing?.listingPrice ?? 0)
      : selectedPrice;
   const allSelectedSeatsAreHeld = isResellMode
      ? Boolean(selectedResellSeatId) && Boolean(selectedResellHoldId)
      : selectedSeats.every(selectedSeat => Boolean(holdsBySeatId[selectedSeat.seat.id]?.holdId));
   const bookingButtonLabel = isResellMode ? '예매하기' : `${selectedSeats.length}매 예매하기`;
   const displaySeats = useMemo(() => {
      if (isSeatInteractionLocked) {
         return seats.map(
            seat =>
               ({
                  ...seat,
                  status: 'disabled',
               }) satisfies SeatItem,
         );
      }

      if (!isResellMode) {
         return seats;
      }

      return seats.map(seat => {
         if (resellListingBySeatId.has(seat.id)) {
            return {
               ...seat,
               status: selectedSeatIdSet.has(seat.id) ? 'selected' : 'available',
            } satisfies SeatItem;
         }

         return {
            ...seat,
            status: 'disabled',
         } satisfies SeatItem;
      });
   }, [isResellMode, isSeatInteractionLocked, resellListingBySeatId, seats, selectedSeatIdSet]);

   const releaseSelectedResellHold = async () => {
      if (!selectedResellHoldIdRef.current) {
         setSelectedResellHoldId(null);
         setSelectedResellSeatId(null);
         return;
      }

      const holdId = selectedResellHoldIdRef.current;

      await releaseResaleListingHold(holdId);
      selectedResellHoldIdRef.current = null;
      setSelectedResellHoldId(null);
      setSelectedResellSeatId(null);
   };

   const handleSelectResellListing = async (seatId: string, listing: ResellListingItem) => {
      if (!bookingEntryState?.queueTokenJti || isResellHoldPending) {
         return;
      }

      setIsResellHoldPending(true);

      try {
         const isAlreadySelected = selectedResellSeatId === seatId;

         if (isAlreadySelected && selectedResellHoldIdRef.current) {
            await releaseSelectedResellHold();
            return;
         }

         if (selectedResellHoldIdRef.current) {
            await releaseSelectedResellHold();
         }

         const hold = await holdResaleListing({
            listingId: listing.listingId,
            queueTokenJti: bookingEntryState.queueTokenJti,
         });

         selectedResellHoldIdRef.current = hold.holdId;
         setSelectedResellHoldId(hold.holdId);
         setSelectedResellSeatId(seatId);
      } catch (error) {
         window.alert(getErrorMessage(error, '리셀 좌석 점유 중 오류가 발생했습니다.'));
      } finally {
         setIsResellHoldPending(false);
      }
   };

   const handleProceedToPayment = () => {
      if (isResellMode) {
         if (!selectedResellListing) {
            return;
         }

         persistResellHoldRef.current = true;

         navigate('/tickets/resell-payment', {
            state: {
               buyerId: bookingEntryState?.userId,
               listingId: selectedResellListing.listingId,
               holdId: selectedResellHoldId,
               queueTokenJti: bookingEntryState?.queueTokenJti,
               sellerId: selectedResellListing.sellerId,
               settlementAmount: selectedResellListing.settlementAmount,
               totalAmount: selectedResellListing.totalAmount,
               totalBuyerFee: selectedResellListing.totalBuyerFee,
               totalSellerFee: selectedResellListing.totalSellerFee,
               seatInfo: selectedResellListing.seatInfo,
               matchTitle: bookingEntryState?.matchTitle,
               venue: bookingEntryState?.venue,
               dateTime: bookingEntryState?.dateTime,
               turnstileToken: bookingEntryState?.turnstileToken,
               botData,
            },
         });
         return;
      }

      navigate('/tickets/payment', {
         state: bookingEntryState,
      });
   };

   const sectionBounds = useMemo(() => {
      if (seatBlocks.length === 0) {
         return null;
      }

      const blockMetrics = seatBlocks.map((block, index) => {
         const width = block.cols * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;
         const height = block.rows * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;
         const renderedOffsetX = block.offsetX + index * BLOCK_CARD_COLUMN_GAP;

         return {
            ...block,
            width,
            height,
            renderedOffsetX,
            right: renderedOffsetX + width,
            bottom: block.offsetY + height,
         };
      });

      return {
         left: Math.min(...blockMetrics.map(block => block.renderedOffsetX)),
         top: Math.min(...blockMetrics.map(block => block.offsetY)),
         right: Math.max(...blockMetrics.map(block => block.right)),
         bottom: Math.max(...blockMetrics.map(block => block.bottom)),
         blocks: blockMetrics,
      };
   }, [seatBlocks]);

   const directionBadgePosition = useMemo(() => {
      if (!sectionBounds) {
         return null;
      }

      const badgeHeight = 48;
      const sectionHeight = sectionBounds.bottom - sectionBounds.top;
      const badgeOffset = Math.max(156, Math.min(260, Math.round(sectionHeight * 0.44)));

      return {
         left: (sectionBounds.left + sectionBounds.right) / 2,
         top: Math.max(-160, sectionBounds.top - badgeHeight - badgeOffset),
      };
   }, [sectionBounds]);

   const stageContentBounds = useMemo(() => {
      if (seatBlocks.length === 0) {
         return null;
      }

      const blockMetrics = seatBlocks.map((block, index) => {
         const blockWidth = block.cols * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;
         const blockHeight = block.rows * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;
         const renderedOffsetX = block.offsetX + index * BLOCK_CARD_COLUMN_GAP;
         const cardLeft = renderedOffsetX - BLOCK_CARD_PADDING_X;
         const cardTop = block.offsetY - (BLOCK_CARD_PADDING_TOP + BLOCK_CARD_LABEL_HEIGHT + BLOCK_CARD_LABEL_GAP);
         const cardWidth = blockWidth + BLOCK_CARD_PADDING_X * 2;
         const cardHeight =
            BLOCK_CARD_PADDING_TOP +
            BLOCK_CARD_LABEL_HEIGHT +
            BLOCK_CARD_LABEL_GAP +
            blockHeight +
            BLOCK_CARD_PADDING_BOTTOM;

         return {
            left: cardLeft,
            top: cardTop,
            right: cardLeft + cardWidth,
            bottom: cardTop + cardHeight,
         };
      });

      return {
         left: Math.min(...blockMetrics.map(block => block.left)),
         top: Math.min(...blockMetrics.map(block => block.top)),
         right: Math.max(...blockMetrics.map(block => block.right)),
         bottom: Math.max(...blockMetrics.map(block => block.bottom)),
      };
   }, [seatBlocks]);

   const _getDefaultBlockMapView = () => {
      if (!stageContentBounds || mapViewportSize.width === 0 || mapViewportSize.height === 0) {
         return {
            scale: 1,
            offset: { x: 0, y: 0 },
         };
      }

      const centeredStageLeft = (mapViewportSize.width - STAGE_WIDTH) / 2;

      return {
         scale: 1,
         offset: {
            x: DEFAULT_SEAT_MAP_LEFT_PADDING - centeredStageLeft - stageContentBounds.left,
            y: DEFAULT_SEAT_MAP_TOP_PADDING - 56 - stageContentBounds.top,
         },
      };
   };

   const minimapLayout = useMemo(() => {
      if (!sectionBounds) {
         return null;
      }

      const width = sectionBounds.right - sectionBounds.left;
      const height = sectionBounds.bottom - sectionBounds.top;
      const scale = Math.min(
         (MINIMAP_WIDTH - MINIMAP_PADDING_X * 2) / width,
         (MINIMAP_HEIGHT - MINIMAP_PADDING_Y * 2) / height,
      );
      const offsetX = (MINIMAP_WIDTH - width * scale) / 2;
      const offsetY = (MINIMAP_HEIGHT - height * scale) / 2;

      return {
         bounds: sectionBounds,
         scale,
         offsetX,
         offsetY,
         blocks: sectionBounds.blocks.map(block => ({
            id: block.id,
            x: offsetX + (block.renderedOffsetX - sectionBounds.left) * scale,
            y: offsetY + (block.offsetY - sectionBounds.top) * scale,
            width: block.width * scale,
            height: block.height * scale,
         })),
      };
   }, [sectionBounds]);

   const minimapViewport = useMemo(() => {
      if (!sectionBounds) {
         return null;
      }

      if (mapViewportSize.width === 0 || mapViewportSize.height === 0) {
         return null;
      }

      const stageLeft = (mapViewportSize.width - STAGE_WIDTH * seatMapScale) / 2 + seatMapOffset.x;
      const stageTop = 56 + seatMapOffset.y;
      const visibleLeft = (0 - stageLeft) / seatMapScale;
      const visibleTop = (0 - stageTop) / seatMapScale;
      const visibleRight = (mapViewportSize.width - stageLeft) / seatMapScale;
      const visibleBottom = (mapViewportSize.height - stageTop) / seatMapScale;

      const intersectLeft = Math.max(sectionBounds.left, visibleLeft);
      const intersectTop = Math.max(sectionBounds.top, visibleTop);
      const intersectRight = Math.min(sectionBounds.right, visibleRight);
      const intersectBottom = Math.min(sectionBounds.bottom, visibleBottom);

      if (intersectRight <= intersectLeft || intersectBottom <= intersectTop || !minimapLayout) {
         return null;
      }

      return {
         left: minimapLayout.offsetX + (intersectLeft - sectionBounds.left) * minimapLayout.scale,
         top: minimapLayout.offsetY + (intersectTop - sectionBounds.top) * minimapLayout.scale,
         width: (intersectRight - intersectLeft) * minimapLayout.scale,
         height: (intersectBottom - intersectTop) * minimapLayout.scale,
      };
   }, [
      mapViewportSize.height,
      mapViewportSize.width,
      minimapLayout,
      seatMapOffset.x,
      seatMapOffset.y,
      seatMapScale,
      sectionBounds,
   ]);

   const getDefaultSeatMapView = () => {
      if (!sectionBounds || mapViewportSize.width === 0 || mapViewportSize.height === 0) {
         return {
            scale: 1,
            offset: { x: 0, y: 0 },
         };
      }

      const contentWidth = sectionBounds.right - sectionBounds.left;
      const contentHeight = sectionBounds.bottom - sectionBounds.top;
      const availableWidth = Math.max(1, mapViewportSize.width - DEFAULT_SEAT_MAP_LEFT_PADDING * 2);
      const availableHeight = Math.max(1, mapViewportSize.height - 56 - DEFAULT_SEAT_MAP_TOP_PADDING * 2);
      const scale = Math.min(
         MAX_SCALE,
         Math.max(MIN_SCALE, Math.min(availableWidth / contentWidth, availableHeight / contentHeight)),
      );
      const contentCenterX = (sectionBounds.left + sectionBounds.right) / 2;
      const contentCenterY = (sectionBounds.top + sectionBounds.bottom) / 2;
      const targetCenterY = 56 + DEFAULT_SEAT_MAP_TOP_PADDING + availableHeight / 2;

      return {
         scale: Number(scale.toFixed(2)),
         offset: {
            x: (STAGE_WIDTH / 2 - contentCenterX) * scale,
            y: targetCenterY - 56 - contentCenterY * scale,
         },
      };
   };

   const updateSeatMapScale = (nextScale: number) => {
      setSeatMapScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(nextScale.toFixed(2)))));
   };

   const resetSeatMapView = () => {
      const nextView = getDefaultSeatMapView();

      setSeatMapScale(nextView.scale);
      setSeatMapOffset(nextView.offset);
   };

   useEffect(() => {
      const nextView = getDefaultSeatMapView();

      setSeatMapScale(nextView.scale);
      setSeatMapOffset(nextView.offset);
   }, [mapViewportSize.height, mapViewportSize.width, sectionBounds, zone.id]);

   const toggleSeat = (seat: SeatItem) => {
      if (isSeatInteractionLocked) {
         return;
      }

      if (pendingSeatIds.includes(seat.id) || isResellHoldPending) {
         return;
      }

      if (seat.status === 'disabled' || seat.status === 'held') {
         return;
      }

      if (isResellMode) {
         const listing = resellListingBySeatId.get(seat.id);

         if (!listing) {
            return;
         }

         void handleSelectResellListing(seat.id, listing);
         return;
      }

      void holdSeat(zone.id, seat);
   };

   const handleRemoveSelectedSeat = (selectedZoneId: string, seatId: string) => {
      if (isResellMode) {
         void releaseSelectedResellHold();
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
         void releaseSelectedResellHold();
         return;
      }

      void clearSelectedSeats(selectedSeats);
   };

   const handleMapPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('button')) {
         return;
      }

      dragStartRef.current = {
         x: event.clientX - seatMapOffset.x,
         y: event.clientY - seatMapOffset.y,
      };
      setIsSeatMapDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
   };

   const handleMapPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isSeatMapDragging || !dragStartRef.current) {
         return;
      }

      setSeatMapOffset({
         x: event.clientX - dragStartRef.current.x,
         y: event.clientY - dragStartRef.current.y,
      });
   };

   const handleMapPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
      dragStartRef.current = null;
      setIsSeatMapDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
         event.currentTarget.releasePointerCapture(event.pointerId);
      }
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
                     directionBadgePosition={directionBadgePosition}
                     isSeatMapDragging={isSeatMapDragging}
                     mapViewportRef={mapViewportRef}
                     minimapLayout={minimapLayout}
                     minimapViewport={minimapViewport}
                     seatBlocks={seatBlocks}
                     seatMapOffset={seatMapOffset}
                     seatMapScale={seatMapScale}
                     seats={displaySeats}
                     selectedSeatIdSet={selectedSeatIdSet}
                     zoneColor={zone.color}
                     zoneName={zone.name}
                     onMapPointerDown={handleMapPointerDown}
                     onMapPointerMove={handleMapPointerMove}
                     onMapPointerUp={handleMapPointerUp}
                     onResetSeatMapView={resetSeatMapView}
                     onToggleSeat={toggleSeat}
                     onUpdateSeatMapScale={updateSeatMapScale}
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
                        {isResellMode && resellInsightsQuery.isPending ? (
                           <div className="flex h-full min-h-[240px] items-center justify-center px-5 text-center text-body-1-medium text-muted-foreground">
                              리셀 좌석 정보를 불러오는 중입니다.
                           </div>
                        ) : isResellMode && resellInsightsQuery.isError ? (
                           <div className="flex h-full min-h-[240px] items-center justify-center px-5 text-center text-body-1-medium text-muted-foreground">
                              리셀 좌석 정보를 불러오지 못했습니다.
                           </div>
                        ) : isResellMode && resellInsights ? (
                           <ResellZonePreviewSheet
                              insights={resellInsights}
                              zone={zone}
                              selectedListingId={selectedResellListing?.listingId}
                              onSelectListing={listing => {
                                 const mappedSeatId = seatIdByResellListingId.get(listing.listingId);

                                 if (!mappedSeatId) {
                                    return;
                                 }

                                 void handleSelectResellListing(mappedSeatId, listing);
                              }}
                              submitLabel={bookingButtonLabel}
                              submitDisabled={!selectedResellListing}
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
                                    disabled={selectedSeats.length === 0 || !allSelectedSeatsAreHeld}
                                    onClick={handleProceedToPayment}
                                    className={[
                                       'h-12 w-full rounded-[8px] text-label-1-bold transition-colors',
                                       selectedSeats.length === 0 || !allSelectedSeatsAreHeld
                                          ? 'bg-fill-disabled text-disabled-foreground'
                                          : 'bg-primary text-white hover:bg-primary-strong',
                                    ].join(' ')}
                                 >
                                    {bookingButtonLabel}
                                 </button>
                              </div>
                           </>
                        )}
                     </div>
                  </DrawerContent>
               </Drawer>
            </section>

            {isResellMode && resellInsightsQuery.isPending ? (
               <aside className="hidden w-full shrink-0 items-center justify-center border-l border-border-light bg-background px-5 text-center text-body-1-medium text-muted-foreground xl:flex xl:w-[420px]">
                  리셀 좌석 정보를 불러오는 중입니다.
               </aside>
            ) : isResellMode && resellInsights ? (
               <ResellSeatSidebar
                  insights={resellInsights}
                  selectedListingId={selectedResellListing?.listingId}
                  zone={zone}
                  zoneOverviewImage={zoneOverviewImage}
                  stadiumName={stadiumName}
                  onSelectListing={listing => {
                     const mappedSeatId = seatIdByResellListingId.get(listing.listingId);

                     if (!mappedSeatId) {
                        return;
                     }

                     void handleSelectResellListing(mappedSeatId, listing);
                  }}
                  onSubmit={handleProceedToPayment}
               />
            ) : isResellMode && resellInsightsQuery.isError ? (
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
                        disabled={selectedSeats.length === 0 || !allSelectedSeatsAreHeld}
                        onClick={handleProceedToPayment}
                        className={[
                           'h-[56px] w-full rounded-[8px] text-label-1-bold transition-colors',
                           selectedSeats.length === 0 || !allSelectedSeatsAreHeld
                              ? 'bg-fill-disabled text-disabled-foreground'
                              : 'bg-primary text-white hover:bg-primary-strong',
                        ].join(' ')}
                     >
                        {bookingButtonLabel}
                     </button>
                  </div>
               </aside>
            )}
         </main>
      </div>
   );
}

export default SeatsPage;
