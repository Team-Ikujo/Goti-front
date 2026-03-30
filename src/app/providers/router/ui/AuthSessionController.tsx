import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { reissueAccessToken } from '@/features/auth/api/authApi';
import SessionWarningDialog from '@/shared/widgets/layout/auth/SessionWarningDialog';

const shouldKeepSessionAlivePath = (pathname: string) =>
   pathname.startsWith('/books') || pathname.startsWith('/tickets');

const AuthSessionController = () => {
   const { pathname } = useLocation();
   const navigate = useNavigate();
   const isReissuingRef = useRef(false);
   const hasHydrated = useAuthStore(state => state.hasHydrated);
   const hasResolvedSession = useAuthStore(state => state.hasResolvedSession);
   const accessToken = useAuthStore(state => state.accessToken);
   const authExpiresAt = useAuthStore(state => state.authExpiresAt);
   const sessionRemainingSeconds = useAuthStore(state => state.sessionRemainingSeconds);
   const isManualLogout = useAuthStore(state => state.isManualLogout);
   const logoutReason = useAuthStore(state => state.logoutReason);
   const startAuthSessionTimer = useAuthStore(state => state.startAuthSessionTimer);
   const stopAuthSessionTimer = useAuthStore(state => state.stopAuthSessionTimer);
   const syncAuthSession = useAuthStore(state => state.syncAuthSession);
   const setAccessToken = useAuthStore(state => state.setAccessToken);
   const setHasResolvedSession = useAuthStore(state => state.setHasResolvedSession);
   const clearAuth = useAuthStore(state => state.clearAuth);
   const [isWarningDismissed, setIsWarningDismissed] = useState(false);

   const showWarning =
      !!accessToken &&
      sessionRemainingSeconds > 0 &&
      sessionRemainingSeconds <= 60 &&
      pathname !== '/session-expired' &&
      !isWarningDismissed;

   useEffect(() => {
      if (!hasHydrated) {
         return;
      }

      if (hasResolvedSession) {
         return;
      }

      if (accessToken) {
         setHasResolvedSession(true);
         return;
      }

      if (isManualLogout) {
         setHasResolvedSession(true);
         return;
      }

      let cancelled = false;

      reissueAccessToken()
         .then((response) => {
            if (cancelled) {
               return;
            }

            setAccessToken(response.accessToken);
         })
         .catch(() => {
            return;
         })
         .finally(() => {
            if (cancelled) {
               return;
            }

            setHasResolvedSession(true);
         });

      return () => {
         cancelled = true;
      };
   }, [accessToken, hasHydrated, hasResolvedSession, isManualLogout, setAccessToken, setHasResolvedSession]);

   useEffect(() => {
      if (!hasHydrated || !hasResolvedSession) {
         return;
      }

      syncAuthSession();
   }, [hasHydrated, hasResolvedSession, syncAuthSession]);

   useEffect(() => {
      if (!hasHydrated || !hasResolvedSession) {
         return;
      }

      if (authExpiresAt === null) {
         stopAuthSessionTimer();
         return;
      }

      startAuthSessionTimer();

      return () => {
         stopAuthSessionTimer();
      };
   }, [authExpiresAt, hasHydrated, hasResolvedSession, startAuthSessionTimer, stopAuthSessionTimer]);

   useEffect(() => {
      if (!accessToken || sessionRemainingSeconds > 60) {
         setIsWarningDismissed(false);
      }
   }, [accessToken, sessionRemainingSeconds]);

   useEffect(() => {
      if (logoutReason !== 'expired') {
         return;
      }

      navigate('/session-expired', { replace: true });
   }, [logoutReason, navigate]);

   useEffect(() => {
      if (!hasHydrated || !hasResolvedSession) {
         return;
      }

      if (!accessToken) {
         return;
      }

      if (!shouldKeepSessionAlivePath(pathname)) {
         return;
      }

      if (sessionRemainingSeconds <= 0 || sessionRemainingSeconds > 60) {
         return;
      }

      if (isReissuingRef.current) {
         return;
      }

      let cancelled = false;
      isReissuingRef.current = true;

      reissueAccessToken()
         .then((response) => {
            if (cancelled) {
               return;
            }

            setAccessToken(response.accessToken);
         })
         .catch(() => {
            if (cancelled) {
               return;
            }

            clearAuth('expired');
         })
         .finally(() => {
            isReissuingRef.current = false;
         });

      return () => {
         cancelled = true;
      };
   }, [accessToken, clearAuth, hasHydrated, hasResolvedSession, pathname, sessionRemainingSeconds, setAccessToken]);

   const handleExtendSession = async () => {
      if (isReissuingRef.current) {
         return;
      }

      isReissuingRef.current = true;

      try {
         // 경고 팝업의 연장 버튼은 실제 재발급으로 세션을 갱신해야 서버 상태와 어긋나지 않는다.
         const response = await reissueAccessToken();
         setAccessToken(response.accessToken);
         setIsWarningDismissed(false);
      } catch {
         clearAuth('expired');
      } finally {
         isReissuingRef.current = false;
      }
   };

   return showWarning ? (
      <SessionWarningDialog
         remainingSeconds={sessionRemainingSeconds}
         onClose={() => setIsWarningDismissed(true)}
         onExtend={handleExtendSession}
      />
   ) : null;
};

export default AuthSessionController;
