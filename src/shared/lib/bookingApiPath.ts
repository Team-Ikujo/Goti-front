import { teams } from '@/entities/team/model/teams';
import { isMswEnabled } from '@/shared/config/runtime';
import { useBookingEntryStore } from '@/shared/lib/useBookingEntryStore';

const API_PREFIX = '/api/';
// 2026-04-19 GCP-only shutdown: teamCode 라우팅 비활성화 (Worker 제거 + api.go-ti.shop 직통).
// deploy/prod 브랜치 전용 패치 — AWS 복구 시 develop 재 merge 하여 원복.
const shouldScopeBookingApiPath = false;

const normalizeTeamCode = (teamCode?: string) => {
   const trimmedValue = teamCode?.trim();

   return trimmedValue ? encodeURIComponent(trimmedValue) : '';
};

const resolveTeamCodeFromTeamKey = (teamKey?: string) => {
   if (!teamKey) {
      return undefined;
   }

   return teams.find((team) => team.id === teamKey)?.teamCode;
};

const resolveTeamCodeFromServerTeamId = (serverTeamId?: string) => {
   if (!serverTeamId) {
      return undefined;
   }

   return teams.find((team) => team.serverTeamId === serverTeamId)?.teamCode;
};

export const getBookingApiTeamCode = (explicitTeamCode?: string) => {
   const normalizedExplicitTeamCode = normalizeTeamCode(explicitTeamCode);

   if (normalizedExplicitTeamCode) {
      return normalizedExplicitTeamCode;
   }

   const bookingEntry = useBookingEntryStore.getState().entry;
   const resolvedTeamCode =
      resolveTeamCodeFromTeamKey(bookingEntry?.homeTeamId) ?? resolveTeamCodeFromServerTeamId(bookingEntry?.serverHomeTeamId);

   return normalizeTeamCode(resolvedTeamCode);
};

/**
 * Cloud 팀 요청 기준으로 예매 트래픽은 `/api/{teamCode}/v1/...` 형태의 경로를 사용한다.
 * 실제 라우팅 규칙이 바뀌더라도 이 helper만 수정하면 예매 플로우 전체에 반영할 수 있다.
 */
export const buildBookingApiPath = (path: string, explicitTeamCode?: string) => {
   if (!shouldScopeBookingApiPath) {
      return path;
   }

   const teamCode = getBookingApiTeamCode(explicitTeamCode);

   if (!teamCode || !path.startsWith(API_PREFIX)) {
      return path;
   }

   const scopedApiPrefix = `${API_PREFIX}${teamCode}/`;

   if (path.startsWith(scopedApiPrefix)) {
      return path;
   }

   return path.replace(API_PREFIX, scopedApiPrefix);
};

export const buildBookingApiUrl = ({
   path,
   baseUrl,
   teamCode,
}: {
   path: string;
   baseUrl?: string;
   teamCode?: string;
}) => {
   const resolvedPath = buildBookingApiPath(path, teamCode);

   if (!baseUrl) {
      return resolvedPath;
   }

   return new URL(resolvedPath, baseUrl).toString();
};
