import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { reissueAccessToken } from '@/features/auth/api/authApi';

const shouldKeepSessionAlivePath = (pathname: string) =>
   pathname.startsWith('/books') || pathname.startsWith('/tickets');

const AuthSessionController = () => {
   const { pathname } = useLocation();
   const isReissuingRef = useRef(false);
   const hasHydrated = useAuthStore(state => state.hasHydrated);
   const hasResolvedSession = useAuthStore(state => state.hasResolvedSession);
   const accessToken = useAuthStore(state => state.accessToken);
   const authExpiresAt = useAuthStore(state => state.authExpiresAt);
   const sessionRemainingSeconds = useAuthStore(state => state.sessionRemainingSeconds);
   const isManualLogout = useAuthStore(state => state.isManualLogout);
   const startAuthSessionTimer = useAuthStore(state => state.startAuthSessionTimer);
   const stopAuthSessionTimer = useAuthStore(state => state.stopAuthSessionTimer);
   const syncAuthSession = useAuthStore(state => state.syncAuthSession);
   const setAccessToken = useAuthStore(state => state.setAccessToken);
   const setHasResolvedSession = useAuthStore(state => state.setHasResolvedSession);
   const clearAuth = useAuthStore(state => state.clearAuth);

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

   return null;
};

export default AuthSessionController;
