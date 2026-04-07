import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchResaleListingCountsByGrades, fetchResaleListings } from '@/entities/resale/api/resaleApi';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';

import {
   fetchSeatGrades,
   fetchSeatSections,
   fetchTicketPricingPolicy,
   mapSeatSectionsToZones,
   mergeBookingZones,
   resolvePricingByGradeId,
} from '@/pages/books/api/bookingApi';
import { getBookingTeamConfig, getZoneDisplayOrder, getBookingZones } from '@/pages/books/model/zoneData';
import type { ZoneItem } from '@/pages/books/model/types';
import { getBookingFlowMode } from '@/shared/lib/booking-flow';
import { getCompletedResalePurchaseLookup } from '@/shared/lib/paymentCompleteStorage';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';

import BookingCaptchaGate from './components/BookingCaptchaGate';
import BookingZoneDesktopLayout from './components/BookingZoneDesktopLayout';
import BookingZoneMobileLayout from './components/BookingZoneMobileLayout';
import BooksExitDialog from '@/shared/widgets/layout/books/BooksExitDialog';
import { isPurchasableResaleListing, resolveResaleListingZoneId } from '@/pages/books/model/resellMatching';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createMockCaptcha(length = 6): string {
   return Array.from({ length }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');
}
const BooksPage = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const routeBookingEntryState = location.state as BookingEntryState | null;
   const bookingFlowMode = getBookingFlowMode(location.search);
   const storedBookingEntryState = useBookingEntryStore(state => state.entry);
   const bookingEntryState = routeBookingEntryState ?? storedBookingEntryState;
   const setBookingEntry = useBookingEntryStore(state => state.setEntry);
   const patchBookingEntry = useBookingEntryStore(state => state.patchEntry);
   const clearBookingEntry = useBookingEntryStore(state => state.clearEntry);
   const clearAllSelections = useSeatSelectionStore(state => state.clearAllSelections);
   const clearSeatHolds = useSeatHoldStore(state => state.clearSeatHolds);
   const clearTimer = useBookingFlowTimerStore(state => state.clearTimer);
   const shouldForceNewSessionRef = useRef(Boolean(bookingEntryState?.forceNewSession));
   const bookingTeamConfig = useMemo(
      () => getBookingTeamConfig(bookingEntryState?.homeTeamId),
      [bookingEntryState?.homeTeamId],
   );
   const requiresCaptcha = Boolean(bookingEntryState?.requireCaptcha);
   const localZones = useMemo(
      () =>
         [...getBookingZones(bookingEntryState?.homeTeamId)].sort(
            (a, b) =>
               getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(a.id) -
                  getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(b.id) || b.remaining - a.remaining,
         ),
      [bookingEntryState?.homeTeamId],
   );
   const { data: apiZones } = useQuery({
      queryKey: [
         'booking-zones',
         bookingFlowMode,
         bookingEntryState?.stadiumId,
         bookingEntryState?.gameId,
         bookingEntryState?.serverHomeTeamId,
         bookingEntryState?.leagueType,
         bookingEntryState?.gameDate,
      ],
      enabled: Boolean(
         bookingEntryState?.stadiumId &&
            bookingEntryState?.gameId &&
            bookingEntryState?.serverHomeTeamId &&
            bookingEntryState?.leagueType &&
            bookingEntryState?.gameDate,
      ),
      queryFn: async () => {
         const shouldForceNewSession = shouldForceNewSessionRef.current;
         const grades = await fetchSeatGrades({
            gameId: bookingEntryState!.gameId!,
            forceNewSession: shouldForceNewSession,
         });

         const [sections, pricingPolicy] = await Promise.all([
            fetchSeatSections({
               stadiumId: bookingEntryState!.stadiumId!,
               gameId: bookingEntryState!.gameId!,
            }),
            fetchTicketPricingPolicy(bookingEntryState!.serverHomeTeamId!).catch(() => undefined),
         ]);

         if (shouldForceNewSession) {
            shouldForceNewSessionRef.current = false;
            patchBookingEntry({
               forceNewSession: false,
            });
         }

         // 리셀 모드: 구역(section)별로 gradeId를 추출해 등급별 리셀 재고를 조회하고,
         // 각 섹션의 gradeId로 재고를 매핑해 sectionId 키 Map으로 변환한다.
         let remainingBySectionId: Map<string, number> | undefined;
         if (bookingFlowMode === 'resell') {
            const uniqueGradeIds = [...new Set(sections.map(s => s.gradeId).filter(Boolean))];
            const countByGradeId = await fetchResaleListingCountsByGrades(
               bookingEntryState!.gameId!,
               uniqueGradeIds,
            );
            remainingBySectionId = new Map(
               sections.map(s => [s.sectionId, countByGradeId.get(s.gradeId) ?? 0]),
            );
         }
         const pricingByGradeId = resolvePricingByGradeId({
            policy: pricingPolicy,
            gameDate: bookingEntryState?.gameDate,
            leagueType: bookingEntryState?.leagueType,
         });

         if (bookingFlowMode === 'resell') {
            return mapSeatSectionsToZones({
               sections,
               grades,
               teamId: bookingEntryState?.homeTeamId,
               pricingByGradeId,
               remainingBySectionId,
            });
         }

         return mapSeatSectionsToZones({
            sections,
            grades,
            teamId: bookingEntryState?.homeTeamId,
            pricingByGradeId,
         });
      },
   });
   const mergedBaseZones = useMemo(
      () =>
         mergeBookingZones({
            localZones,
            apiZones,
         }),
      [apiZones, localZones],
   );
   const { data: resellRemainingByZoneId } = useQuery({
      queryKey: ['resell-zone-remaining', bookingEntryState?.gameId, mergedBaseZones.map(zone => zone.id).sort()],
      enabled: bookingFlowMode === 'resell' && Boolean(bookingEntryState?.gameId) && mergedBaseZones.length > 0,
      queryFn: async () => {
         if (!bookingEntryState?.gameId) {
            return new Map<string, number>();
         }

         const listings = await fetchResaleListings();
         const completedResaleLookup = getCompletedResalePurchaseLookup();
         const nextCounts = new Map<string, number>();

         listings.forEach(listing => {
            if (
               completedResaleLookup.listingIds.has(listing.listingId) ||
               completedResaleLookup.seatInfos.has(listing.seatInfo) ||
               !isPurchasableResaleListing(listing, bookingEntryState.gameId)
            ) {
               return;
            }

            const zoneId = resolveResaleListingZoneId({
               zones: mergedBaseZones,
               listing,
            });

            if (!zoneId) {
               return;
            }

            nextCounts.set(zoneId, (nextCounts.get(zoneId) ?? 0) + 1);
         });

         return nextCounts;
      },
      placeholderData: previousData => previousData,
   });
   const zones = useMemo<ZoneItem[]>(() => {
      const normalizedZones =
         bookingFlowMode === 'resell'
            ? mergedBaseZones.map(zone => ({
                 ...zone,
                 remaining: resellRemainingByZoneId?.get(zone.id) ?? 0,
              }))
            : mergedBaseZones;

      return [...normalizedZones].sort(
         (left, right) => right.remaining - left.remaining || left.name.localeCompare(right.name, 'ko-KR'),
      );
   }, [bookingFlowMode, mergedBaseZones, resellRemainingByZoneId]);

   const [selectedZoneId, setSelectedZoneId] = useState(
      () => zones.find(zone => zone.remaining > 0)?.id ?? zones[0]?.id ?? '',
   );
   const [isCaptchaOpen, setIsCaptchaOpen] = useState(requiresCaptcha);
   const [captchaInput, setCaptchaInput] = useState('');
   const [captchaError, setCaptchaError] = useState('');
   const [captchaSeed, setCaptchaSeed] = useState(0);
   const [isZoneDrawerOpen, setIsZoneDrawerOpen] = useState(true);
   const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
   const shouldRestoreHistoryRef = useRef(false);

   const captchaCode = useMemo(() => createMockCaptcha(), [captchaSeed]);

   const exitBookingFlow = () => {
      clearTimer();
      clearSeatHolds();
      clearAllSelections();
      clearBookingEntry();
      navigate('/', { replace: true });
   };

   useEffect(() => {
      if (routeBookingEntryState) {
         setBookingEntry(routeBookingEntryState);
      }
   }, [routeBookingEntryState, setBookingEntry]);

   useEffect(() => {
      setSelectedZoneId(zones.find(zone => zone.remaining > 0)?.id ?? zones[0]?.id ?? '');
   }, [zones]);

   useEffect(() => {
      if (zones.length === 0) {
         return;
      }

      patchBookingEntry({
         bookingZones: zones,
      });
   }, [patchBookingEntry, zones]);

   useEffect(() => {
      if (!requiresCaptcha) {
         return;
      }

      setCaptchaInput('');
      setCaptchaError('');
      setCaptchaSeed(prev => prev + 1);
      setIsCaptchaOpen(true);
   }, [requiresCaptcha]);

   useEffect(() => {
      const mediaQuery = window.matchMedia('(min-width: 1024px)');
      const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
         if (event.matches) {
            setIsZoneDrawerOpen(false);
         }
      };

      handleChange(mediaQuery);
      mediaQuery.addEventListener('change', handleChange);

      return () => {
         mediaQuery.removeEventListener('change', handleChange);
      };
   }, []);

   useEffect(() => {
      if (isCaptchaOpen) {
         setIsZoneDrawerOpen(false);
      }
   }, [isCaptchaOpen]);

   useEffect(() => {
      window.history.pushState({ bookingExitGuard: true }, '', window.location.href);

      const handlePopState = () => {
         shouldRestoreHistoryRef.current = true;
         setIsExitDialogOpen(true);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
         window.removeEventListener('popstate', handlePopState);
      };
   }, []);

   const resolvedBookingEntryState = useMemo<BookingEntryState | undefined>(() => {
      if (!bookingEntryState) {
         return undefined;
      }

      return {
         ...bookingEntryState,
         requireCaptcha: undefined,
         forceNewSession: undefined,
         bookingZones: zones,
      } satisfies BookingEntryState;
   }, [bookingEntryState, zones]);

   const handleSelectZone = (zoneId: string) => {
      const selectedZone = zones.find(zone => zone.id === zoneId);

      if (!selectedZone || selectedZone.remaining <= 0) {
         return;
      }

      setSelectedZoneId(zoneId);
      navigate(
         {
            pathname: `/books/seats/${zoneId}`,
            search: location.search,
         },
         {
            state: resolvedBookingEntryState,
         },
      );
   };

   const refreshCaptcha = () => {
      setCaptchaSeed(prev => prev + 1);
      setCaptchaError('');
   };

   const submitCaptcha = () => {
      if (captchaInput.trim() !== captchaCode) {
         setCaptchaError('보안 문자가 일치하지 않습니다. 대소문자를 정확히 입력해 주세요.');
         return;
      }

      setIsCaptchaOpen(false);
      setCaptchaInput('');
      setCaptchaError('');
      navigate(
         {
            pathname: location.pathname,
            search: location.search,
         },
         {
            replace: true,
            state: resolvedBookingEntryState,
         },
      );
   };

   return (
      <div className="w-full bg-background text-foreground">
         <BooksExitDialog
            open={isExitDialogOpen}
            onOpenChange={open => {
               setIsExitDialogOpen(open);

               if (!open && shouldRestoreHistoryRef.current) {
                  window.history.pushState({ bookingExitGuard: true }, '', window.location.href);
                  shouldRestoreHistoryRef.current = false;
               }
            }}
            onConfirm={() => {
               shouldRestoreHistoryRef.current = false;
               setIsExitDialogOpen(false);
               exitBookingFlow();
            }}
         />
         <BookingCaptchaGate
            open={isCaptchaOpen}
            captchaCode={captchaCode}
            value={captchaInput}
            error={captchaError}
            onOpenChange={open => {
               if (!requiresCaptcha) {
                  setIsCaptchaOpen(open);
                  return;
               }

               if (!open) {
                  navigate(-1);
                  return;
               }

               setIsCaptchaOpen(true);
            }}
            onChangeValue={value => {
               setCaptchaInput(value);
               if (captchaError) {
                  setCaptchaError('');
               }
            }}
            onRefresh={refreshCaptcha}
            onSubmit={submitCaptcha}
         />
         <BookingZoneMobileLayout
            bookingFlowMode={bookingFlowMode}
            zones={zones}
            selectedZoneId={selectedZoneId}
            isCaptchaOpen={isCaptchaOpen}
            isZoneDrawerOpen={isZoneDrawerOpen}
            onOpenChange={setIsZoneDrawerOpen}
            onSelectZone={handleSelectZone}
            stadiumImage={bookingTeamConfig.stadiumImage}
            stadiumImageAlt={bookingTeamConfig.stadiumImageAlt}
         />
         <BookingZoneDesktopLayout
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
            stadiumImage={bookingTeamConfig.stadiumImage}
            stadiumImageAlt={bookingTeamConfig.stadiumImageAlt}
         />
      </div>
   );
};

export default BooksPage;
