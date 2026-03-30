import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

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
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';

import BookingCaptchaGate from './components/BookingCaptchaGate';
import BookingZoneDesktopLayout from './components/BookingZoneDesktopLayout';
import BookingZoneMobileLayout from './components/BookingZoneMobileLayout';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createMockCaptcha(length = 6): string {
   return Array.from(
      { length },
      () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)],
   ).join('');
}
const BooksPage = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const routeBookingEntryState = location.state as BookingEntryState | null;
   const bookingFlowMode = getBookingFlowMode(location.search);
   const storedBookingEntryState = useBookingEntryStore((state) => state.entry);
   const bookingEntryState = routeBookingEntryState ?? storedBookingEntryState;
   const setBookingEntry = useBookingEntryStore((state) => state.setEntry);
   const patchBookingEntry = useBookingEntryStore((state) => state.patchEntry);
   const bookingTeamConfig = useMemo(() => getBookingTeamConfig(bookingEntryState?.homeTeamId), [bookingEntryState?.homeTeamId]);
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
         const [grades, sections, pricingPolicy] = await Promise.all([
            fetchSeatGrades(bookingEntryState!.gameId!, bookingEntryState!.stadiumId!),
            fetchSeatSections(bookingEntryState!.stadiumId!),
            fetchTicketPricingPolicy(bookingEntryState!.serverHomeTeamId!).catch(() => undefined),
         ]);
         const pricingByGradeId = resolvePricingByGradeId({
            policy: pricingPolicy,
            gameDate: bookingEntryState?.gameDate,
            leagueType: bookingEntryState?.leagueType,
         });

         return mapSeatSectionsToZones({
            sections,
            grades,
            teamId: bookingEntryState?.homeTeamId,
            pricingByGradeId,
         });
      },
   });
   const zones = useMemo<ZoneItem[]>(() => {
      const mergedZones = mergeBookingZones({
         localZones,
         apiZones,
      });

      return [...mergedZones].sort(
         (left, right) => right.remaining - left.remaining || left.name.localeCompare(right.name, 'ko-KR'),
      );
   }, [apiZones, localZones]);

   const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? '');
   const [isCaptchaOpen, setIsCaptchaOpen] = useState(requiresCaptcha);
   const [captchaInput, setCaptchaInput] = useState('');
   const [captchaError, setCaptchaError] = useState('');
   const [captchaSeed, setCaptchaSeed] = useState(0);
   const [isZoneDrawerOpen, setIsZoneDrawerOpen] = useState(true);

   const captchaCode = useMemo(() => createMockCaptcha(), [captchaSeed]);

   useEffect(() => {
      if (routeBookingEntryState) {
         setBookingEntry(routeBookingEntryState);
      }
   }, [routeBookingEntryState, setBookingEntry]);

   useEffect(() => {
      setSelectedZoneId(zones[0]?.id ?? '');
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
      setCaptchaSeed((prev) => prev + 1);
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

   const resolvedBookingEntryState = useMemo<BookingEntryState | undefined>(() => {
      if (!bookingEntryState) {
         return undefined;
      }

      return {
         ...bookingEntryState,
         requireCaptcha: undefined,
         bookingZones: zones,
      } satisfies BookingEntryState;
   }, [bookingEntryState, zones]);

   const handleSelectZone = (zoneId: string) => {
      setSelectedZoneId(zoneId);
      navigate({
         pathname: `/books/seats/${zoneId}`,
         search: location.search,
      }, {
         state: resolvedBookingEntryState,
      });
   };

   const refreshCaptcha = () => {
      setCaptchaSeed((prev) => prev + 1);
      setCaptchaError('');
   };

   const submitCaptcha = () => {
      if (captchaInput.trim().toUpperCase() !== captchaCode) {
         setCaptchaError('보안 문자가 일치하지 않습니다. 다시 확인해 주세요.');
         return;
      }

      setIsCaptchaOpen(false);
      setCaptchaInput('');
      setCaptchaError('');
      navigate({
         pathname: location.pathname,
         search: location.search,
      }, {
         replace: true,
         state: resolvedBookingEntryState,
      });
   };

   return (
      <div className="w-full bg-background text-foreground">
         <BookingCaptchaGate
            open={isCaptchaOpen}
            captchaCode={captchaCode}
            value={captchaInput}
            error={captchaError}
            onOpenChange={(open) => {
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
            onChangeValue={(value) => {
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
