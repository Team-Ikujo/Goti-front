import { useQuery } from '@tanstack/react-query';

import { fetchSeatGrades } from '@/entities/seat/api/seatGradeApi';
import { fetchResaleHistoryGraph } from '@/entities/resale/api/resaleApi';
import { buildResellZoneInsightsFromApi } from '@/entities/resale/model/resellZoneInsights';

const normalizeGradeName = (value?: string) => (value ?? '').replace(/\s+/g, '').trim().toLowerCase();

export const useResellRegisterInsights = ({
   enabled,
   gameId,
   seatGradeName,
   sectionCode,
   unitPrice,
}: {
   enabled: boolean;
   gameId?: string;
   seatGradeName?: string;
   sectionCode: string;
   unitPrice: number;
}) => {
   return useQuery({
      queryKey: ['mypage-resell-register-insights', gameId, seatGradeName, sectionCode, unitPrice],
      enabled: enabled && Boolean(gameId),
      staleTime: 60_000,
      queryFn: async () => {
         const resolvedGameId = gameId!;
         const seatGrades = await fetchSeatGrades({ gameId: resolvedGameId });
         const normalizedTargetGradeName = normalizeGradeName(seatGradeName ?? sectionCode);
         const matchedGrade = seatGrades.find((seatGrade) => {
            const normalizedSeatGradeName = normalizeGradeName(seatGrade.name);

            return (
               normalizedSeatGradeName === normalizedTargetGradeName ||
               normalizedSeatGradeName.includes(normalizedTargetGradeName) ||
               normalizedTargetGradeName.includes(normalizedSeatGradeName)
            );
         });

         if (!matchedGrade) {
            return { status: 'missing-grade' as const };
         }

         const [minuteGraph, dayGraph] = await Promise.all([
            fetchResaleHistoryGraph(resolvedGameId, matchedGrade.seatGradeId, 'HOUR'),
            fetchResaleHistoryGraph(resolvedGameId, matchedGrade.seatGradeId, 'DAY'),
         ]);

         if (minuteGraph.length === 0 && dayGraph.length === 0) {
            return { status: 'empty' as const };
         }

         return {
            status: 'success' as const,
            insights: buildResellZoneInsightsFromApi({
               zone: {
                  id: matchedGrade.seatGradeId,
                  name: matchedGrade.name,
                  price: unitPrice,
               },
               listings: [],
               minuteGraph,
               dayGraph,
            }),
         };
      },
   });
};
