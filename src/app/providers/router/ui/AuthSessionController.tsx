import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { reissueAccessToken } from '@/features/auth/api/authApi';

const shouldKeepSessionAlivePath = (pathname: string) =>
   pathname.startsWith('/books') || pathname.startsWith('/tickets');

const AuthSessionController = () => {
   const { pathname } = useLocation();
   const isReissuingRef = useRef(false);
   const accessToken = useAuthStore(state => state.accessToken);
   const authExpiresAt = useAuthStore(state => state.authExpiresAt);
   const sessionRemainingSeconds = useAuthStore(state => state.sessionRemainingSeconds);
   const startAuthSessionTimer = useAuthStore(state => state.startAuthSessionTimer);
   const stopAuthSessionTimer = useAuthStore(state => state.stopAuthSessionTimer);
   const syncAuthSession = useAuthStore(state => state.syncAuthSession);
   const setAccessToken = useAuthStore(state => state.setAccessToken);
   const clearAuth = useAuthStore(state => state.clearAuth);

   useEffect(() => {
      syncAuthSession();
   }, [syncAuthSession]);

   useEffect(() => {
      if (authExpiresAt === null) {
         stopAuthSessionTimer();
         return;
      }

      startAuthSessionTimer();

      return () => {
         stopAuthSessionTimer();
      };
   }, [authExpiresAt, startAuthSessionTimer, stopAuthSessionTimer]);

   useEffect(() => {
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
   }, [accessToken, clearAuth, pathname, sessionRemainingSeconds, setAccessToken]);

   return null;
};

export default AuthSessionController;
